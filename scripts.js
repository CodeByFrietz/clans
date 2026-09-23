async function loadClans() {

    const { data, error } = await supabaseClient
        .from("clans")
        .select(`
            id,
            name,
            tag,
            description,
            created_at,
            profiles (
                username
            )
        `)
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(error);

        return;
    }


    const clanGrid =
        document.querySelector(".clan-grid");


    if (!clanGrid) {
        return;
    }


    clanGrid.innerHTML = "";


    data.forEach(clan => {

        const card =
            document.createElement("div");

        card.className = "clan-card";


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
                    ${escapeHTML(clan.description)}
                </p>

                <div class="clan-info">

                    👑
                    ${escapeHTML(
                        clan.profiles?.username ||
                        "Unknown"
                    )}

                </div>

            </div>

        `;


        clanGrid.appendChild(card);

    });

}
