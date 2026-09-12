const API_URL = "https://script.google.com/macros/s/AKfycbyTtaUSGi4evF_NZI-0ujeAmxhAEt6NFna2ip8HPxNOzW1YgspyE9_OjrD6rEKHxbZdYw/exec";

// Fetch with automatic retry AND a timeout — Google Apps Script + venue
// signal can be slow or hang entirely, so force-cancel a stuck request
// after a few seconds instead of leaving the button stuck forever.
async function fetchWithRetry(url, options, retries = 2, delayMs = 1200, timeoutMs = 8000) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            const isLastAttempt = attempt === retries;
            const timedOut = error.name === "AbortError";
            console.warn(
                `Fetch attempt ${attempt + 1} failed${timedOut ? " (timed out)" : ""}:`,
                error
            );
            if (isLastAttempt) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
}

const submitBtn = document.getElementById("submitBtn");
const showText = document.getElementById("showText");
const phoneInput = document.getElementById("phoneInput");
const loginSection = document.getElementById("loginSection");
const guestSection = document.getElementById("guestSection");
const welcomeName = document.getElementById("welcomeName");
const tableBtn = document.getElementById("tableBtn");
const finalTableNumber = document.getElementById("finalTableNumber");
const flipCard = document.getElementById("flipCard");

// Draw a pulsing ring around the guest's table on the floor plan.
// Uses a real <circle> element (not a CSS filter on <use>) because
// filters on <use> don't render reliably on mobile browsers.

const svgNS = "http://www.w3.org/2000/svg";
const floorPlanSvg = document.getElementById("floorPlanSvg");

function clearTableGlow() {
    const oldRing = document.getElementById("activeTableGlow");
    if (oldRing) {
        oldRing.remove();
    }
}

function glowTable(tableId) {
    clearTableGlow();

    const tableEl = document.getElementById(tableId);

    if (!tableEl) {
        console.warn("No matching SVG table found for id:", tableId);
        return;
    }

    const cx = tableEl.getAttribute("x");
    const cy = tableEl.getAttribute("y");
    const isVip = tableId === "table-vip";

    const ring = document.createElementNS(svgNS, "circle");
    ring.setAttribute("id", "activeTableGlow");
    ring.setAttribute("cx", cx);
    ring.setAttribute("cy", cy);
    ring.setAttribute("r", isVip ? "30" : "24");
    ring.setAttribute("class", "table-glow-ring");

    floorPlanSvg.appendChild(ring);
}

// STORE CURRENT GUEST

let currentGuest = null;

// STEP 1
// FIND GUEST

submitBtn.addEventListener("click", async () => {
        const input = phoneInput.value.trim();
        // EMPTY INPUT
        if (!input) {
            showText.textContent = "Please enter your phone number.";
            return;
        }
        // CHECKING
        showText.textContent = "Checking...";
        submitBtn.disabled = true;

        try {

            const result =
                await fetchWithRetry(
                    API_URL,
                    {
                        method: "POST",

                        body: JSON.stringify({
                            action: "find",
                            input: input
                        })
                    }
                );


            console.log(
                "Find result:",
                result
            );

            // GUEST FOUND

            if (result.success) {
                currentGuest = result;
                welcomeName.innerHTML = `Welcome, <br>${result.name.toUpperCase()}!`;
                showText.textContent = "";

                // Hide login
                loginSection.classList.add(
                    "hidden"
                );


                // Show welcome
                guestSection.classList.remove(
                    "hidden"
                );

            }
            // GUEST NOT FOUND


            else {

                showText.textContent =
                    result.message ||
                    "Guest not found.";

            }

        }


        catch (error) {

            console.error(
                "Find error:",
                error
            );


            showText.textContent =
                "Unable to connect. Please try again.";

        }


        finally {

            submitBtn.disabled = false;

        }

    }
);

// STEP 2
// VIEW MY TABLE
//
// Clicking this button will:
//
// 1. Check the guest in
// 2. Get their table number
// 3. Glow the guest's table on the floor plan
// 4. Show parking QR
// 5. Flip the card

tableBtn.addEventListener(
    "click",
    async () => {

        if (!currentGuest) {

            return;
        }
        // Prevent double clicking


        tableBtn.disabled = true;

        tableBtn.textContent =
            "PLEASE WAIT...";


        try {

            // CHECK IN

            const result =
                await fetchWithRetry(
                    API_URL,
                    {
                        method: "POST",

                        body: JSON.stringify({

                            action: "checkin",

                            row: currentGuest.row

                        })
                    }
                );


            console.log(
                "Check-in result:",
                result
            );


            // ---------------------------------
            // SUCCESS
            // ---------------------------------

            if (result.success) {

                // Use table returned by API
                finalTableNumber.textContent = `Table No: ${result.table}`;
                finalTableNumber.style.color = "#fafafa";

                // Make the guest's table glow on the floor plan
                const tableId =
                    `table-${String(result.table).trim().toLowerCase()}`;

                glowTable(tableId);

                // Hide welcome section
                guestSection.classList.add(
                    "hidden"
                );


                // Flip to parking QR
                flipCard.classList.add(
                    "flipped"
                );

            }


            // ---------------------------------
            // ALREADY CHECKED IN
            // ---------------------------------

            else {

                alert(
                    result.message ||
                    "Unable to check in."
                );


                tableBtn.disabled = false;

                tableBtn.textContent =
                    "VIEW MY TABLE";

            }

        }


        catch (error) {

            console.error(
                "Check-in error:",
                error
            );


            alert(
                "Unable to connect. Please try again."
            );


            tableBtn.disabled = false;

            tableBtn.textContent =
                "VIEW MY TABLE";

        }

    }
);