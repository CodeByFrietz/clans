/* ==================================================
   CINDERSMP CLAN WEBSITE
   STAGE 2A
   ================================================== */


/* ==================================================
   STORAGE
   ================================================== */

function getClans() {

    const saved =
        localStorage.getItem("cindersmp_clans");

    if (!saved) {
        return [];
    }

    try {

        return JSON.parse(saved);

    } catch (error) {

        console.error(
            "Could not read clans:",
            error
        );

        return [];

    }

}



function saveClans(clans) {

    localStorage.setItem(
        "cindersmp_clans",
        JSON.stringify(clans)
    );

}



/* ==================================================
   ACTIVITY STORAGE
   ================================================== */

function getActivity() {

    const saved =
        localStorage.getItem(
            "cindersmp_activity"
        );

    if (!saved) {
        return [];
    }

    try {

        return JSON.parse(saved);

    } catch (error) {

        console.error(
            "Could not read activity:",
            error
        );

        return [];

    }

}



function saveActivity(activity) {

    localStorage.setItem(
        "cindersmp_activity",
        JSON.stringify(activity)
    );

}



/* ==================================================
   SECURITY
   Prevent HTML injection when displaying user input
   ================================================== */

function escapeHTML(value) {

    const element =
        document.createElement("div");

    element.textContent =
        value ?? "";

    return element.innerHTML;

}



/* ==================================================
   CREATE CLAN
   ================================================== */

const createClanForm =
    document.getElementById(
        "createClanForm"
    );


if (createClanForm) {


    createClanForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            /* ------------------------------------------
               GET FORM VALUES
               ------------------------------------------ */

            const name =
                document
                    .getElementById("clanName")
                    .value
                    .trim();


            const tag =
                document
                    .getElementById("clanTag")
                    .value
                    .trim()
                    .toUpperCase();


            const leader =
                document
                    .getElementById("leader")
                    .value
                    .trim();


            const description =
                document
                    .getElementById("description")
                    .value
                    .trim();


            const message =
                document.getElementById(
                    "formMessage"
                );



            /* ------------------------------------------
               BASIC VALIDATION
               ------------------------------------------ */

            if (
                !name ||
                !tag ||
                !leader
            ) {

                message.textContent =
                    "Please fill in all required fields.";

                message.className =
                    "form-message error";

                return;

            }



            /* ------------------------------------------
               CLAN NAME VALIDATION
               ------------------------------------------ */

            if (name.length < 2) {

                message.textContent =
                    "Clan name must be at least 2 characters.";

                message.className =
                    "form-message error";

                return;

            }



            /* ------------------------------------------
               TAG VALIDATION
               ------------------------------------------ */

            if (
                tag.length < 2 ||
                tag.length > 5
            ) {

                message.textContent =
                    "Clan tag must be between 2 and 5 characters.";

                message.className =
                    "form-message error";

                return;

            }



            /* ------------------------------------------
               TAG CHARACTERS
               ------------------------------------------ */

            const validTag =
                /^[A-Z0-9]+$/;


            if (!validTag.test(tag)) {

                message.textContent =
                    "Clan tag can only contain letters and numbers.";

                message.className =
                    "form-message error";

                return;

            }



            /* ------------------------------------------
               MINECRAFT USERNAME
               ------------------------------------------ */

            const validMinecraftUsername =
                /^[A-Za-z0-9_]+$/;


            if (
                !validMinecraftUsername.test(
                    leader
                )
            ) {

                message.textContent =
                    "Minecraft username contains invalid characters.";

                message.className =
                    "form-message error";

                return;

            }



            /* ------------------------------------------
               GET EXISTING CLANS
               ------------------------------------------ */

            const clans =
                getClans();



            /* ------------------------------------------
               CHECK NAME
               ------------------------------------------ */

            const duplicateName =
                clans.some(
                    function (clan) {

                        return (
                            clan.name
                                .toLowerCase() ===
                            name.toLowerCase()
                        );

                    }
                );


            if (duplicateName) {

                message.textContent =
                    "That clan name is already being used.";

                message.className =
                    "form-message error";

                return;

            }



            /* ------------------------------------------
               CHECK TAG
               ------------------------------------------ */

            const duplicateTag =
                clans.some(
                    function (clan) {

                        return (
                            clan.tag.toLowerCase() ===
                            tag.toLowerCase()
                        );

                    }
                );


            if (duplicateTag) {

                message.textContent =
                    "That clan tag is already being used.";

                message.className =
                    "form-message error";

                return;

            }



            /* ------------------------------------------
               CREATE CLAN OBJECT
               ------------------------------------------ */

            const newClan = {

                id:
                    crypto.randomUUID
                    ? crypto.randomUUID()
                    : Date.now().toString(),

                name:
                    name,

                tag:
                    tag,

                leader:
                    leader,

                description:
                    description,

                members:
                    [
                        leader
                    ],

                createdAt:
                    new Date().toISOString()

            };



            /* ------------------------------------------
               SAVE CLAN
               ------------------------------------------ */

            clans.push(
                newClan
            );


            saveClans(
                clans
            );



            /* ------------------------------------------
               CREATE ACTIVITY
               ------------------------------------------ */

            const activity =
                getActivity();


            activity.unshift({

                id:
                    Date.now().toString(),

                message:
                    `${name} [${tag}] was created by ${leader}.`,

                createdAt:
                    new Date().toISOString()

            });


            saveActivity(
                activity
            );



            /* ------------------------------------------
               SUCCESS
               ------------------------------------------ */

            message.textContent =
                "🔥 Clan created successfully!";

            message.className =
                "form-message success";



            /* ------------------------------------------
               REDIRECT
               ------------------------------------------ */

            setTimeout(
                function () {

                    window.location.href =
                        "clans.html";

                },
                1000
            );

        }
    );

}



/* ==================================================
   LOAD CLANS
   ================================================== */

function loadClans() {


    const clanGrid =
        document.querySelector(
            ".clan-grid"
        );


    if (!clanGrid) {
        return;
    }


    const clans =
        getClans();


    /* Clear existing example clans */

    clanGrid.innerHTML = "";



    /* ------------------------------------------
       NO CLANS
       ------------------------------------------ */

    if (clans.length === 0) {

        clanGrid.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    🏰
                </div>

                <h2>
                    No clans yet
                </h2>

                <p>
                    Be the first clan on CinderSMP.
                </p>

                <br>

                <a
                    href="create-clan.html"
                    class="button primary"
                >
                    🔥 Create Clan
                </a>

            </div>

        `;

        return;

    }



    /* ------------------------------------------
       DISPLAY CLANS
       ------------------------------------------ */

    clans.forEach(
        function (clan) {


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "clan-card";


            card.innerHTML = `

                <div class="clan-symbol">
                    🔥
                </div>

                <div>

                    <h2>

                        ${escapeHTML(
                            clan.name
                        )}

                        <small>
                            [${escapeHTML(
                                clan.tag
                            )}]
                        </small>

                    </h2>

                    <p>

                        ${
                            escapeHTML(
                                clan.description ||
                                "No description."
                            )
                        }

                    </p>

                    <div class="clan-info">

                        👑
                        ${escapeHTML(
                            clan.leader
                        )}

                        ·

                        👥
                        ${
                            clan.members
                                ? clan.members.length
                                : 1
                        }

                        member${
                            (
                                clan.members &&
                                clan.members.length !== 1
                            )
                                ? "s"
                                : ""
                        }

                    </div>

                </div>

            `;


            clanGrid.appendChild(
                card
            );


        }
    );

}



/* ==================================================
   LOAD ACTIVITY
   ================================================== */

function loadActivity() {


    const activityList =
        document.querySelector(
            ".activity-list"
        );


    if (!activityList) {
        return;
    }


    const activity =
        getActivity();



    /* ------------------------------------------
       NO ACTIVITY
       ------------------------------------------ */

    if (activity.length === 0) {

        activityList.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    📢
                </div>

                <h2>
                    No activity yet
                </h2>

                <p>
                    Clan activity will appear here.
                </p>

            </div>

        `;

        return;

    }



    /* ------------------------------------------
       DISPLAY ACTIVITY
       ------------------------------------------ */

    activityList.innerHTML = "";


    activity
        .slice(0, 30)
        .forEach(
            function (item) {


                const element =
                    document.createElement(
                        "div"
                    );


                element.className =
                    "activity-item";


                element.innerHTML = `

                    <div class="activity-icon">
                        🔥
                    </div>

                    <div>

                        ${escapeHTML(
                            item.message
                        )}

                        <small>
                            ${formatDate(
                                item.createdAt
                            )}
                        </small>

                    </div>

                `;


                activityList.appendChild(
                    element
                );


            }
        );

}



/* ==================================================
   DATE FORMAT
   ================================================== */

function formatDate(date) {


    const parsedDate =
        new Date(date);


    return parsedDate.toLocaleString(
        undefined,
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}



/* ==================================================
   START WEBSITE
   ================================================== */

loadClans();

loadActivity();
