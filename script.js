import { supabase } from "./supabase.js";


// ================================
// HELPERS
// ================================

const $ = (selector) =>
  document.querySelector(selector);

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function message(text, type = "") {

  const box = $("#formMessage");

  if (!box) return;

  box.textContent = text;
  box.className = `form-message ${type}`;

}

async function currentUser() {

  const {
    data,
    error
  } = await supabase.auth.getUser();

  if (error) return null;

  return data.user;

}


// ================================
// AUTH NAVIGATION
// ================================

async function setupNavigation() {

  const nav = $(".navbar nav");

  if (!nav) return;

  const user = await currentUser();

  const oldAuth = $(".auth-nav");

  if (oldAuth) oldAuth.remove();

  const wrapper =
    document.createElement("div");

  wrapper.className = "auth-nav";

  if (user) {

    wrapper.innerHTML = `
      <a href="create-clan.html">Create Clan</a>
      <button id="logoutButton">Logout</button>
    `;

  } else {

    wrapper.innerHTML = `
      <a href="login.html">Login</a>
      <a class="nav-register" href="register.html">
        Register
      </a>
    `;

  }

  nav.appendChild(wrapper);

  const logout =
    $("#logoutButton");

  if (logout) {

    logout.addEventListener(
      "click",
      async () => {

        await supabase.auth.signOut();

        window.location.href =
          "index.html";

      }
    );

  }

}


// ================================
// REGISTER
// ================================

const registerForm =
  $("#registerForm");

if (registerForm) {

  registerForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const username =
        $("#username").value.trim();

      const email =
        $("#email").value.trim();

      const password =
        $("#password").value;


      if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) {

        message(
          "Username must be 3-16 characters and use only letters, numbers or _.",
          "error"
        );

        return;

      }


      if (password.length < 6) {

        message(
          "Password must be at least 6 characters.",
          "error"
        );

        return;

      }


      message("Creating account...");


      // Check username first

      const {
        data: existing
      } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();


      if (existing) {

        message(
          "That username is already taken.",
          "error"
        );

        return;

      }


      const {
        data,
        error
      } = await supabase.auth.signUp({

        email,
        password,

        options: {
          data: {
            username
          }
        }

      });


      if (error) {

        message(
          error.message,
          "error"
        );

        return;

      }


      if (!data.user) {

        message(
          "Account could not be created.",
          "error"
        );

        return;

      }


      message(
        "Account created successfully!",
        "success"
      );


      setTimeout(() => {

        window.location.href =
          "clans.html";

      }, 1200);

    }
  );

}


// ================================
// LOGIN
// ================================

const loginForm =
  $("#loginForm");

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const email =
        $("#loginEmail").value.trim();

      const password =
        $("#loginPassword").value;


      message("Logging in...");


      const {
        error
      } = await supabase.auth.signInWithPassword({

        email,
        password

      });


      if (error) {

        message(
          "Login failed: " + error.message,
          "error"
        );

        return;

      }


      message(
        "Login successful!",
        "success"
      );


      setTimeout(() => {

        window.location.href =
          "index.html";

      }, 700);

    }
  );

}


// ================================
// CREATE CLAN
// ================================

const createClanForm =
  $("#createClanForm");

if (createClanForm) {

  createClanForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const user =
        await currentUser();


      if (!user) {

        message(
          "You must login first.",
          "error"
        );

        setTimeout(() => {

          window.location.href =
            "login.html";

        }, 1000);

        return;

      }


      const name =
        $("#clanName").value.trim();

      const tag =
        $("#clanTag").value
          .trim()
          .toUpperCase();

      const description =
        $("#description").value.trim();

      const leader =
        $("#leader").value.trim();


      if (name.length < 2) {

        message(
          "Clan name is too short.",
          "error"
        );

        return;

      }


      if (!/^[A-Z0-9]{2,5}$/.test(tag)) {

        message(
          "Clan tag must be 2-5 letters/numbers.",
          "error"
        );

        return;

      }


      if (!/^[A-Za-z0-9_]{3,16}$/.test(leader)) {

        message(
          "Invalid Minecraft username.",
          "error"
        );

        return;

      }


      message("Checking clan ownership...");


      const {
        data: ownedClan
      } = await supabase
        .from("clans")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();


      if (ownedClan) {

        message(
          "You already own a clan.",
          "error"
        );

        return;

      }


      message("Creating clan...");


      const {
        data: clan,
        error
      } = await supabase
        .from("clans")
        .insert({

          name,
          tag,
          description,
          owner_id: user.id

        })
        .select()
        .single();


      if (error) {

        if (
          error.code === "23505"
        ) {

          message(
            "That clan name or tag is already taken.",
            "error"
          );

        } else {

          message(
            error.message,
            "error"
          );

        }

        return;

      }


      const {
        error: memberError
      } = await supabase
        .from("clan_members")
        .insert({

          clan_id: clan.id,

          minecraft_username:
            leader,

          is_owner: true

        });


      if (memberError) {

        await supabase
          .from("clans")
          .delete()
          .eq("id", clan.id);

        message(
          memberError.message,
          "error"
        );

        return;

      }


      await supabase
        .from("activity")
        .insert({

          clan_id: clan.id,

          actor_id: user.id,

          message:
            `🔥 ${name} [${tag}] was created.`

        });


      message(
        "🔥 Clan created!",
        "success"
      );


      setTimeout(() => {

        window.location.href =
          `clan.html?id=${clan.id}`;

      }, 800);

    }
  );

}


// ================================
// LOAD HOME
// ================================

async function loadHome() {

  const container =
    $("#homeClans");

  if (!container) return;


  const {
    data: clans,
    error
  } = await supabase
    .from("clans")
    .select(`
      id,
      name,
      tag,
      description,
      clan_members (
        minecraft_username,
        is_owner
      )
    `)
    .order(
      "created_at",
      {
        ascending: false
      }
    )
    .limit(6);


  if (error) {

    container.innerHTML = `
      <div class="empty-state">
        <h2>Unable to load clans</h2>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

    return;

  }


  if (!clans?.length) {

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔥</div>
        <h2>No clans yet</h2>
        <p>Be the first clan on CinderSMP.</p>
        <a class="primary-btn" href="create-clan.html">
          Create Clan
        </a>
      </div>
    `;

    return;

  }


  container.innerHTML =
    clans.map(clan => {

      const members =
        clan.clan_members || [];

      const owner =
        members.find(
          member => member.is_owner
        );


      return `

        <a
          class="clan-card"
          href="clan.html?id=${clan.id}"
        >

          <div class="clan-card-top">

            <span class="clan-tag">
              [${escapeHTML(clan.tag)}]
            </span>

            <span class="member-count">
              👥 ${members.length}
            </span>

          </div>

          <h2>
            ${escapeHTML(clan.name)}
          </h2>

          <p>
            ${escapeHTML(
              clan.description ||
              "No description."
            )}
          </p>

          <div class="clan-card-bottom">

            <span>
              👑
              ${escapeHTML(
                owner?.minecraft_username ||
                "Unknown"
              )}
            </span>

            <span class="view-clan">
              View →
            </span>

          </div>

        </a>

      `;

    }).join("");

}


// ================================
// LOAD CLANS PAGE
// ================================

async function loadClansPage() {

  const grid =
    $("#clanGrid");

  if (!grid) return;


  const {
    data: clans,
    error
  } = await supabase
    .from("clans")
    .select(`
      id,
      name,
      tag,
      description,
      created_at,
      clan_members (
        minecraft_username,
        is_owner
      )
    `)
    .order(
      "created_at",
      {
        ascending: false
      }
    );


  if (error) {

    grid.innerHTML = `
      <div class="empty-state">
        <h2>Could not load clans</h2>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

    return;

  }


  if (!clans?.length) {

    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔥</div>
        <h2>No clans yet</h2>
        <p>Create the first clan.</p>
      </div>
    `;

    return;

  }


  grid.innerHTML =
    clans.map(clan => {

      const members =
        clan.clan_members || [];

      const owner =
        members.find(
          member => member.is_owner
        );


      return `

        <a
          class="clan-card"
          href="clan.html?id=${clan.id}"
        >

          <div class="clan-card-top">

            <span class="clan-tag">
              [${escapeHTML(clan.tag)}]
            </span>

            <span>
              👥 ${members.length}
            </span>

          </div>

          <h2>
            ${escapeHTML(clan.name)}
          </h2>

          <p>
            ${escapeHTML(
              clan.description ||
              "No description."
            )}
          </p>

          <div class="clan-card-bottom">

            <span>
              👑
              ${escapeHTML(
                owner?.minecraft_username ||
                "Unknown"
              )}
            </span>

            <span class="view-clan">
              View →
            </span>

          </div>

        </a>

      `;

    }).join("");

}


// ================================
// LOAD CLAN
// ================================

async function loadClan() {

  const page =
    $("#clanDetails");

  if (!page) return;


  const id =
    new URLSearchParams(
      location.search
    ).get("id");


  if (!id) {

    page.innerHTML = `
      <div class="empty-state">
        <h2>Clan not found</h2>
      </div>
    `;

    return;

  }


  const {
    data: clan,
    error
  } = await supabase
    .from("clans")
    .select(`
      *,
      clan_members (
        id,
        minecraft_username,
        is_owner
      )
    `)
    .eq("id", id)
    .single();


  if (error || !clan) {

    page.innerHTML = `
      <div class="empty-state">
        <h2>Clan not found</h2>
        <p>This clan may have been deleted.</p>
      </div>
    `;

    return;

  }


  const user =
    await currentUser();


  const isOwner =
    user?.id === clan.owner_id;


  const owner =
    clan.clan_members.find(
      member => member.is_owner
    );


  page.innerHTML = `

    <section class="clan-hero">

      <div class="big-clan-tag">
        [${escapeHTML(clan.tag)}]
      </div>

      <div>

        <span class="eyebrow">
          CINDERSMP CLAN
        </span>

        <h1>
          ${escapeHTML(clan.name)}
        </h1>

        <p>
          ${escapeHTML(
            clan.description ||
            "No description."
          )}
        </p>

      </div>

      <div class="clan-stat">

        <strong>
          ${clan.clan_members.length}
        </strong>

        <span>
          Members
        </span>

      </div>

    </section>


    <section class="clan-content">

      <div class="members-panel">

        <div class="section-heading">

          <div>

            <span class="eyebrow">
              CLAN ROSTER
            </span>

            <h2>
              Members
            </h2>

          </div>

        </div>


        <div class="member-list">

          ${clan.clan_members.map(member => `

            <div class="member-row">

              <div class="member-avatar">
                ${member.is_owner ? "👑" : "⚔️"}
              </div>

              <div class="member-info">

                <strong>
                  ${escapeHTML(
                    member.minecraft_username
                  )}
                </strong>

                <span>
                  ${
                    member.is_owner
                      ? "Clan Owner"
                      : "Clan Member"
                  }
                </span>

              </div>

              ${
                member.is_owner
                  ? `<span class="owner-badge">
                       OWNER
                     </span>`
                  : ""
              }

              ${
                isOwner && !member.is_owner
                  ? `
                    <button
                      class="danger-small"
                      data-remove="${member.id}"
                    >
                      Remove
                    </button>
                  `
                  : ""
              }

            </div>

          `).join("")}

        </div>

      </div>


      <aside class="clan-sidebar">

        <div class="info-card">

          <span class="eyebrow">
            LEADER
          </span>

          <h3>
            👑 ${escapeHTML(
              owner?.minecraft_username ||
              "Unknown"
            )}
          </h3>

        </div>


        ${
          isOwner
            ? `

              <div class="owner-controls">

                <span class="eyebrow">
                  OWNER CONTROLS
                </span>

                <h3>
                  Manage Clan
                </h3>

                <form id="addMemberForm">

                  <input
                    id="newMember"
                    maxlength="16"
                    placeholder="Minecraft username"
                    required
                  >

                  <button
                    class="primary-btn"
                    type="submit"
                  >
                    + Add Member
                  </button>

                </form>

                <p
                  id="memberMessage"
                  class="form-message"
                ></p>

                <button
                  id="deleteClan"
                  class="danger-btn"
                >
                  🗑️ Delete Clan
                </button>

              </div>

            `
            : ""
        }

      </aside>

    </section>

  `;


  setupClanControls(
    clan,
    user
  );

}


// ================================
// CLAN CONTROLS
// ================================

function setupClanControls(
  clan,
  user
) {

  const addForm =
    $("#addMemberForm");

  const deleteButton =
    $("#deleteClan");


  if (addForm) {

    addForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const username =
          $("#newMember")
            .value
            .trim();


        if (
          !/^[A-Za-z0-9_]{3,16}$/
            .test(username)
        ) {

          const box =
            $("#memberMessage");

          box.textContent =
            "Invalid Minecraft username.";

          box.className =
            "form-message error";

          return;

        }


        const {
          error
        } = await supabase
          .from("clan_members")
          .insert({

            clan_id: clan.id,

            minecraft_username:
              username,

            is_owner: false

          });


        if (error) {

          const box =
            $("#memberMessage");

          box.textContent =
            error.code === "23505"
              ? "That player is already in this clan."
              : error.message;

          box.className =
            "form-message error";

          return;

        }


        await supabase
          .from("activity")
          .insert({

            clan_id: clan.id,

            actor_id: user.id,

            message:
              `⚔️ ${username} joined ${clan.name}.`

          });


        loadClan();

      }
    );

  }


  document
    .querySelectorAll("[data-remove]")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const id =
            button.dataset.remove;


          if (
            !confirm(
              "Remove this player?"
            )
          ) return;


          const {
            data: member
          } = await supabase
            .from("clan_members")
            .select("minecraft_username")
            .eq("id", id)
            .single();


          await supabase
            .from("clan_members")
            .delete()
            .eq("id", id);


          if (member) {

            await supabase
              .from("activity")
              .insert({

                clan_id: clan.id,

                actor_id: user.id,

                message:
                  `⚔️ ${member.minecraft_username} was removed from ${clan.name}.`

              });

          }


          loadClan();

        }
      );

    });


  if (deleteButton) {

    deleteButton.addEventListener(
      "click",
      async () => {

        if (
          !confirm(
            `Delete ${clan.name} permanently?`
          )
        ) return;


        deleteButton.disabled = true;

        deleteButton.textContent =
          "Deleting...";


        const {
          error
        } = await supabase
          .from("clans")
          .delete()
          .eq("id", clan.id);


        if (error) {

          alert(error.message);

          deleteButton.disabled =
            false;

          deleteButton.textContent =
            "🗑️ Delete Clan";

          return;

        }


        location.href =
          "clans.html";

      }
    );

  }

}


// ================================
// ACTIVITY
// ================================

async function loadActivity() {

  const list =
    $("#activityList");

  if (!list) return;


  const {
    data,
    error
  } = await supabase
    .from("activity")
    .select("*")
    .order(
      "created_at",
      {
        ascending: false
      }
    )
    .limit(50);


  if (error) {

    list.innerHTML = `
      <div class="empty-state">
        <h2>Activity unavailable</h2>
      </div>
    `;

    return;

  }


  if (!data?.length) {

    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📜</div>
        <h2>No activity yet</h2>
      </div>
    `;

    return;

  }


  list.innerHTML =
    data.map(item => `

      <div class="activity-item">

        <div class="activity-icon">
          🔥
        </div>

        <div class="activity-content">

          <strong>
            ${escapeHTML(item.message)}
          </strong>

          <span>
            ${new Date(
              item.created_at
            ).toLocaleString()}
          </span>

        </div>

      </div>

    `).join("");

}


// ================================
// START
// ================================

setupNavigation();
loadHome();
loadClansPage();
loadClan();
loadActivity();
