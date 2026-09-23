/*
    CinderSMP Clan System
*/


/* =========================
   STORAGE
========================= */

function getClans() {

    const clans =
        localStorage.getItem("cindersmp_clans");

    if (!clans) {
        return [];
    }

    return JSON.parse(clans);
}


function saveClans(clans) {

    localStorage.setItem(
        "cindersmp_clans",
        JSON.stringify(clans)
    );

}


/* =========================
   SECURITY
========================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


/* =========================
   CREATE CLAN
========================= */

const createClanForm =
    document.getElementById("createClanForm");


if (createClanForm) {

    createClanForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


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


            if (!name || !tag || !leader) {

                message.textContent =
                    "Please fill in all required fields.";

                message.className =
                    "form-message error";

                return;

            }


            let clans = getClans();


            /* Prevent duplicate clan names */

            const nameExists =
                clans.some(
                    clan =>
                        clan.name.toLowerCase() ===
                        name.toLowerCase()
                );


            if (nameExists) {

                message.textContent =
                    "A clan with this name already exists.";

                message.className =
                    "form-message error";

                return;

            }


            /* Prevent duplicate tags */

            const tagExists =
                clans.some(
                    clan =>
                        clan.tag.toLowerCase() ===
                        tag.toLowerCase()
                );


            if (tagExists) {

                message.textContent =
                    "That clan tag is already being used.";

                message.className =
                    "form-message error";

                return;

            }


            /* Create clan */

            const newClan = {

                id:
                    Date.now().toString(),

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


            clans.push(newClan);


            saveClans(clans);


            /* Save activity */

            const activities =
                JSON.parse(
                    localStorage.getItem(
                        "cindersmp_activity"
                    ) || "[]"
                );


            activities.unshift({

                message:
                    `${name} [${tag}] was created.`,

                createdAt:
                    new Date().toISOString()

            });


            localStorage.setItem(
                "cindersmp_activity",
                JSON.stringify(activities)
            );


            message.textContent =
                "🔥 Clan created successfully!";

            message.className =
                "form-message success";


            createClanForm.reset();


            setTimeout(
                function() {

                    window.location.href =
                        "clans.html";

                },
                1000
            );

        }
    );

}


/* =========================
   DISPLAY CLANS
========================= */

function loadClans() {

    const clanGrid =
        document.querySelector(".clan-grid");


    if (!clanGrid) {
        return;
    }


    const clans =
        getClans();


    /*
        Remove the example clans.
        Real clans will now be generated here.
    */

    clanGrid.innerHTML = "";


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
                    Be the first person to create a clan.
                </p>

                <br>

                <a
                    href="create-clan.html"
                    class="button primary"
                >
                    Create Clan
                </a>

            </div>

        `;

        return;

    }


    clans.forEach(
        function(clan) {

            const card =
                document.createElement("div");


            card.className =
                "clan-card";


            card.innerHTML = `

                <div class="clan-symbol">
                    🔥
                </div>

                <div>

                    <h2>

                        ${escapeHTML(clan.name)}

                        <small>
                            [${escapeHTML(clan.tag)}]
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
                        ${escapeHTML(clan.leader)}

                        ·

                        👥
                        ${clan.members.length}
                        member${
                            clan.members.length === 1
                                ? ""
                                : "s"
                        }

                    </div>

                </div>

            `;


            clanGrid.appendChild(card);

        }
    );

}


/* =========================
   ACTIVITY
========================= */

function loadActivity() {

    const activityList =
        document.querySelector(".activity-list");


    if (!activityList) {
        return;
    }


    const activities =
        JSON.parse(
            localStorage.getItem(
                "cindersmp_activity"
            ) || "[]"
        );


    if (activities.length === 0) {
        return;
    }


    activityList.innerHTML = "";


    activities
        .slice(0, 20)
        .forEach(
            function(activity) {

                const item =
                    document.createElement("div");


                item.className =
                    "activity-item";


                item.innerHTML = `

                    <div class="activity-icon">
                        🔥
                    </div>

                    <div>

                        ${escapeHTML(
                            activity.message
                        )}

                        <small>
                            ${formatDate(
                                activity.createdAt
                            )}
                        </small>

                    </div>

                `;


                activityList.appendChild(item);

            }
        );

}


/* =========================
   DATE
========================= */

function formatDate(date) {

    const time =
        new Date(date);


    return time.toLocaleString();

}


/* =========================
   START
========================= */

loadClans();

loadActivity();
