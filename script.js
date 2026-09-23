const db = window.supabaseClient;


// ============================================
// HELPERS
// ============================================

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function showMessage(element, message, type = "") {

  if (!element) return;

  element.textContent = message;

  element.className = "form-message " + type;

}


function formatDate(date) {

  return new Date(date).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short"
  });

}


async function getUser() {

  const {
    data: { user }
  } = await db.auth.getUser();

  return user;

}


// ============================================
// REGISTER
// ============================================

const registerForm =
  document.getElementById("registerForm");

if (registerForm) {

  registerForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const username =
      document.getElementById("username").value.trim();

    const email =
      document.getElementById("email").value.trim();

    const password =
      document.getElementById("password").value;

    const message =
      document.getElementById("authMessage");


    if (!/^[A-Za-z0-9_]+$/.test(username)) {

      showMessage(
        message,
        "Username can only contain letters, numbers and underscores.",
        "error"
      );

      return;

    }


    showMessage(message, "Creating account...");


    const { error } = await db.auth.signUp({

      email,

      password,

      options: {
        data: {
          username
        }
      }

    });


    if (error) {

      showMessage(
        message,
        error.message,
        "error"
      );

      return;

    }


    showMessage(
      message,
      "Account created! Check your email if confirmation is required.",
      "success"
    );


    setTimeout(() => {

      window.location.href = "clans.html";

    }, 1500);

  });

}


// ============================================
// LOGIN
// ============================================

const loginForm =
  document.getElementById("loginForm");

if (loginForm) {

  loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const email =
      document.getElementById("loginEmail").value.trim();

    const password =
      document.getElementById("loginPassword").value;

    const message =
      document.getElementById("authMessage");


    showMessage(message, "Logging in...");


    const { error } =
      await db.auth.signInWithPassword({

        email,

        password

      });


    if (error) {

      showMessage(
        message,
        error.message,
        "error"
      );

      return;

    }


    showMessage(
      message,
      "Login successful!",
      "success"
    );


    setTimeout(() => {

      window.location.href = "clans.html";

    }, 700);

  });

}


// ============================================
// CREATE CLAN
// ============================================

const createClanForm =
  document.getElementById("createClanForm");

if (createClanForm) {

  createClanForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const message =
      document.getElementById("formMessage");


    const user = await getUser();


    if (!user) {

      showMessage(
        message,
        "You must be logged in to create a clan.",
        "error"
      );

      setTimeout(() => {

        window.location.href = "login.html";

      }, 1000);

      return;

    }


    const name =
      document.getElementById("clanName").value.trim();

    const tag =
      document.getElementById("clanTag").value
        .trim()
        .toUpperCase();

    const description =
      document.getElementById("description").value.trim();

    const leader =
      document.getElementById("leader").value.trim();


    if (!/^[A-Z0-9]+$/.test(tag)) {

      showMessage(
        message,
        "Clan tags can only contain letters and numbers.",
        "error"
      );

      return;

    }


    if (!/^[A-Za-z0-9_]+$/.test(leader)) {

      showMessage(
        message,
        "Minecraft username contains invalid characters.",
        "error"
      );

      return;

    }


    showMessage(message, "Creating clan...");


    // Extra frontend check
    const { data: existingClan } =
      await db
        .from("clans")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();


    if (existingClan) {

      showMessage(
        message,
        "You already own a clan.",
        "error"
      );

      return;

    }


    const { data: clan, error } =
      await db
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

      showMessage(
        message,
        error.message.includes("unique")
          ? "That clan name or tag is already taken."
          : error.message,
        "error"
      );

      return;

    }


    // Add owner as first member

    const { error: memberError } =
      await db
        .from("clan_members")
        .insert({

          clan_id: clan.id,

          minecraft_username: leader,

          is_owner: true

        });


    if (memberError) {

      // Roll back clan if member creation failed

      await db
        .from("clans")
        .delete()
        .eq("id", clan.id);


      showMessage(
        message,
        memberError.message,
        "error"
      );

      return;

    }


    // Activity

    await db
      .from("activity")
      .insert({

        clan_id: clan.id,

        actor_id: user.id,

        message:
          `🔥 ${name} [${tag}] was created!`

      });


    showMessage(
      message,
      "🔥 Clan created successfully!",
      "success"
    );


    setTimeout(() => {

      window.location.href =
        `clan.html?id=${clan.id}`;

    }, 1000);

  });

}


// ============================================
// LOAD CLANS
// ============================================

async function loadClans() {

  const grid =
    document.getElementById("clanGrid");

  if (!grid) return;


  const { data: clans, error } =
    await db
      .from("clans")
      .select(`
        *,
        profiles (
          username
        ),
        clan_members (
          id,
          minecraft_username,
          is_owner
        )
      `)
      .order("created_at", {
        ascending: false
      });


  if (error) {

    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h2>Couldn't load clans</h2>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

    return;

  }


  if (!clans || clans.length === 0) {

    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔥</div>
        <h2>No clans yet</h2>
        <p>Be the first clan on CinderSMP.</p>

        <a
          href="create-clan.html"
          class="primary-btn inline-btn"
        >
          Create Clan
        </a>
      </div>
    `;

    return;

  }


  grid.innerHTML = clans.map(clan => {

    const members =
      clan.clan_members || [];

    return `

      <a
        class="clan-card"
        href="clan.html?id=${clan.id}"
      >

        <div class="clan-glow"></div>

        <div class="clan-card-top">

          <div class="clan-tag">
            [${escapeHTML(clan.tag)}]
          </div>

          <div class="member-count">
            👥 ${members.length}
          </div>

        </div>

        <h2>
          ${escapeHTML(clan.name)}
        </h2>

        <p>
          ${escapeHTML(
            clan.description ||
            "No description provided."
          )}
        </p>

        <div class="clan-card-bottom">

          <span>
            👑
            ${escapeHTML(
              members.find(member => member.is_owner)
                ?.minecraft_username ||
              clan.profiles?.username ||
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


// ============================================
// LOAD CLAN DETAILS
// ============================================

async function loadClanDetails() {

  const container =
    document.getElementById("clanDetails");

  if (!container) return;


  const params =
    new URLSearchParams(window.location.search);

  const clanId =
    params.get("id");


  if (!clanId) {

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h2>Clan not found</h2>
      </div>
    `;

    return;

  }


  const { data: clan, error } =
    await db
      .from("clans")
      .select(`
        *,
        profiles (
          username
        ),
        clan_members (
          id,
          minecraft_username,
          is_owner,
          created_at
        )
      `)
      .eq("id", clanId)
      .single();


  if (error || !clan) {

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h2>Clan not found</h2>
        <p>This clan may have been deleted.</p>
      </div>
    `;

    return;

  }


  const user =
    await getUser();


  const isOwner =
    user && user.id === clan.owner_id;


  const members =
    clan.clan_members || [];


  container.innerHTML = `

    <section class="clan-hero">

      <div class="clan-hero-glow"></div>

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
            "No description provided."
          )}
        </p>

      </div>

      <div class="clan-stats">

        <div>
          <strong>${members.length}</strong>
          <span>Members</span>
        </div>

        <div>
          <strong>🔥</strong>
          <span>Clan</span>
        </div>

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

          <span class="member-total">
            ${members.length}
          </span>

        </div>

        <div
          id="memberList"
          class="member-list"
        >

          ${members.map(member => `

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
                  ? `<span class="owner-badge">OWNER</span>`
                  : ""
              }

              ${
                isOwner && !member.is_owner
                  ? `
                    <button
                      class="danger-small"
                      onclick="removeMember(
                        '${member.id}',
                        '${clan.id}'
                      )"
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
            LEADERSHIP
          </span>

          <h3>Clan Owner</h3>

          <div class="owner-display">
            👑
            ${
              escapeHTML(
                members.find(m => m.is_owner)
                  ?.minecraft_username ||
                clan.profiles?.username ||
                "Unknown"
              )
            }
          </div>

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

                <form
                  id="addMemberForm"
                  class="mini-form"
                >

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
                  class="danger-btn"
                  id="deleteClanButton"
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


  if (isOwner) {

    setupOwnerControls(
      clan,
      user
    );

  }

}


// ============================================
// OWNER CONTROLS
// ============================================

function setupOwnerControls(clan, user) {

  const form =
    document.getElementById("addMemberForm");

  const deleteButton =
    document.getElementById("deleteClanButton");


  if (form) {

    form.addEventListener("submit", async event => {

      event.preventDefault();


      const input =
        document.getElementById("newMember");

      const message =
        document.getElementById("memberMessage");


      const username =
        input.value.trim();


      if (!/^[A-Za-z0-9_]+$/.test(username)) {

        showMessage(
          message,
          "Invalid Minecraft username.",
          "error"
        );

        return;

      }


      const { error } =
        await db
          .from("clan_members")
          .insert({

            clan_id: clan.id,

            minecraft_username: username,

            is_owner: false

          });


      if (error) {

        showMessage(
          message,
          error.message.includes("unique")
            ? "That player is already in the clan."
            : error.message,
          "error"
        );

        return;

      }


      await db
        .from("activity")
        .insert({

          clan_id: clan.id,

          actor_id: user.id,

          message:
            `⚔️ ${username} joined ${clan.name}.`

        });


      input.value = "";

      showMessage(
        message,
        "Member added!",
        "success"
      );


      setTimeout(() => {

        loadClanDetails();

      }, 500);

    });

  }


  if (deleteButton) {

    deleteButton.addEventListener("click", async () => {

      const confirmed =
        confirm(
          `Delete ${clan.name} permanently?\n\nThis will remove the clan and all of its members.`
        );


      if (!confirmed) return;


      deleteButton.disabled = true;

      deleteButton.textContent =
        "Deleting...";


      const { error } =
        await db
          .from("clans")
          .delete()
          .eq("id", clan.id)
          .eq("owner_id", user.id);


      if (error) {

        alert(error.message);

        deleteButton.disabled = false;

        deleteButton.textContent =
          "🗑️ Delete Clan";

        return;

      }


      window.location.href =
        "clans.html";

    });

  }

}


// ============================================
// REMOVE MEMBER
// ============================================

window.removeMember = async function (
  memberId,
  clanId
) {

  const user =
    await getUser();


  if (!user) return;


  const confirmed =
    confirm("Remove this player from the clan?");


  if (!confirmed) return;


  const { data: clan } =
    await db
      .from("clans")
      .select("name, owner_id")
      .eq("id", clanId)
      .single();


  if (!clan || clan.owner_id !== user.id) {

    alert("You do not own this clan.");

    return;

  }


  const { data: member } =
    await db
      .from("clan_members")
      .select("minecraft_username")
      .eq("id", memberId)
      .single();


  const { error } =
    await db
      .from("clan_members")
      .delete()
      .eq("id", memberId);


  if (error) {

    alert(error.message);

    return;

  }


  if (member) {

    await db
      .from("activity")
      .insert({

        clan_id: clanId,

        actor_id: user.id,

        message:
          `⚔️ ${member.minecraft_username} was removed from ${clan.name}.`

      });

  }


  loadClanDetails();

};


// ============================================
// ACTIVITY
// ============================================

async function loadActivity() {

  const list =
    document.getElementById("activityList");

  if (!list) return;


  const { data, error } =
    await db
      .from("activity")
      .select(`
        *,
        clans (
          name,
          tag
        ),
        profiles (
          username
        )
      `)
      .order("created_at", {
        ascending: false
      })
      .limit(50);


  if (error) {

    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h2>Couldn't load activity</h2>
      </div>
    `;

    return;

  }


  if (!data || data.length === 0) {

    list.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          📜
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
            ${formatDate(item.created_at)}
          </span>

        </div>

      </div>

    `).join("");

}


// ============================================
// AUTH NAVIGATION
// ============================================

async function setupAuthNavigation() {

  const user =
    await getUser();


  const nav =
    document.querySelector(".navbar nav");

  if (!nav) return;


  if (user) {

    const logout =
      document.createElement("a");

    logout.href = "#";

    logout.textContent =
      "Logout";

    logout.addEventListener(
      "click",
      async event => {

        event.preventDefault();

        await db.auth.signOut();

        window.location.href =
          "index.html";

      }
    );

    nav.appendChild(logout);

  } else {

    const login =
      document.createElement("a");

    login.href = "login.html";

    login.textContent =
      "Login";

    nav.appendChild(login);

  }

}


// ============================================
// INITIALIZE
// ============================================

loadClans();
loadClanDetails();
loadActivity();
setupAuthNavigation();
