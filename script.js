const API_URL = "https://script.google.com/macros/s/AKfycbzFLVQeRff5GEeQpBa5OyVl3teDLusjjmTD_IeyWVFQz4BcTR84WegTJtp8HEJYP_KKRQ/exec";

const submitBtn = document.getElementById("submitBtn");
const showText = document.getElementById("showText");
const phoneInput = document.getElementById("phoneInput");
const loginSection = document.getElementById("loginSection");
const guestSection = document.getElementById("guestSection");
const welcomeName = document.getElementById("welcomeName");
const tableBtn = document.getElementById("tableBtn");
const finalTableNumber = document.getElementById("finalTableNumber");
const flipCard = document.getElementById("flipCard");

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

            const response =
                await fetch(
                    API_URL,
                    {
                        method: "POST",

                        body: JSON.stringify({
                            action: "find",
                            input: input
                        })
                    }
                );


            const result =
                await response.json();


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


            const response =
                await fetch(
                    API_URL,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            action: "checkin",
                            row: currentGuest.row

                        })
                    }
                );


            const result =
                await response.json();


            console.log(
                "Check-in result:",
                result
            );


            // ---------------------------------
            // SUCCESS
            // ---------------------------------

            if (result.success) {

                // Use table returned by API
                finalTableNumber.textContent =
                    `Table No: ${result.table}`;

                // Make the guest's table glow on the floor plan
                document.querySelectorAll(".table-glow").forEach(el =>
                    el.classList.remove("table-glow")
                );

                const tableId =
                    `table-${String(result.table).trim().toLowerCase()}`;

                const tableEl =
                    document.getElementById(tableId);

                if (tableEl) {
                    tableEl.classList.add("table-glow");
                } else {
                    console.warn(
                        "No matching SVG table found for id:",
                        tableId
                    );
                }

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