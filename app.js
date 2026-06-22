const STORAGE_KEY = "oklee-family-relationship-v1";
const SESSION_KEY = "oklee-family-relationship-session-v1";
const VIEW_KEY = "oklee-family-relationship-view-v2";
const SUPABASE_URL = "https://laquzdfgwtxkcuxzvesg.supabase.co";
const SUPABASE_KEY = "sb_publishable_afRB9ccJ23fNekWd8m3ibA_uZiYUTmo";
const SUPABASE_STATE_TABLE = "family_relationship_state";
const SUPABASE_ARCHIVE_TABLE = "family_relationship_cycles";
const SUPABASE_ROW_ID = "oklee-family-relationship";
const FAMILY_PASSWORD = "hyeon00#";
const FEEDBACK_LIMIT = 5;
const SELF_REFLECTION_LIMIT = 5;

const SELF_REFLECTION_META = {
  strength: {
    label: "내가 스스로 잘하고 있다고 생각하는 것",
    description: "최근 3개월 동안 꾸준히 해왔거나 스스로 대견하게 느끼는 모습을 적어보세요.",
    placeholder: "예: 바쁜 날에도 가족과 대화할 시간을 만들려고 노력했다.",
    tone: "positive",
  },
  recognition: {
    label: "가족에게 인정받고 싶은 것",
    description: "내가 애쓰고 있지만 가족이 아직 잘 모를 수 있는 마음과 행동을 적어보세요.",
    placeholder: "예: 가족의 생활을 챙기기 위해 보이지 않는 곳에서도 많이 고민하고 있다.",
    tone: "recognition",
  },
};

const CATEGORY_META = {
  strength: {
    label: "잘하고 있는 것",
    shortLabel: "잘하고 있어요",
    description: "고맙거나 자랑스럽게 느낀 행동과 모습을 알려주세요.",
    tone: "positive",
  },
  improve: {
    label: "개선해줬으면 하는 것",
    shortLabel: "바라는 변화",
    description: "비난보다 구체적인 행동과 바라는 모습을 적어주세요.",
    tone: "improve",
  },
  challenge: {
    label: "도전해줬으면 하는 것",
    shortLabel: "새로운 도전",
    description: "그 사람이 한 걸음 더 성장할 수 있는 제안을 적어주세요.",
    tone: "challenge",
  },
};

const elements = {
  loginShell: document.querySelector("#loginShell"),
  loginForm: document.querySelector("#loginForm"),
  loginId: document.querySelector("#loginId"),
  loginPassword: document.querySelector("#loginPassword"),
  appShell: document.querySelector("#appShell"),
  pageTitle: document.querySelector("#pageTitle"),
  syncStatus: document.querySelector("#syncStatus"),
  logoutButton: document.querySelector("#logoutButton"),
  cycleCaption: document.querySelector("#cycleCaption"),
  myFeedbackProgress: document.querySelector("#myFeedbackProgress"),
  myFeedbackProgressBar: document.querySelector("#myFeedbackProgressBar"),
  selfBadge: document.querySelector("#selfBadge"),
  receivedBadge: document.querySelector("#receivedBadge"),
  commitmentBadge: document.querySelector("#commitmentBadge"),
  selfReflectionEditor: document.querySelector("#selfReflectionEditor"),
  recipientTabs: document.querySelector("#recipientTabs"),
  feedbackEditor: document.querySelector("#feedbackEditor"),
  receivedSummary: document.querySelector("#receivedSummary"),
  receivedList: document.querySelector("#receivedList"),
  commitmentOverview: document.querySelector("#commitmentOverview"),
  commitmentList: document.querySelector("#commitmentList"),
  cycleActions: document.querySelector("#cycleActions"),
  archiveCycleButton: document.querySelector("#archiveCycleButton"),
  startNextCycleButton: document.querySelector("#startNextCycleButton"),
  familyOverview: document.querySelector("#familyOverview"),
  archiveList: document.querySelector("#archiveList"),
  toast: document.querySelector("#toast"),
};

let state = loadState();
let currentMemberId = localStorage.getItem(SESSION_KEY);
let currentView = localStorage.getItem(VIEW_KEY) || "self";
let activeRecipientId = null;
let remoteUpdatedAt = null;
let remoteSaveTimer = null;
let remoteSaving = false;
let applyingRemoteState = false;
let archives = [];
let toastTimer = null;

function uid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function defaultCycleStartDate() {
  return formatDateInput(new Date());
}

function cycleNameFromDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 관계 점검`;
}

function cycleIdFromDate(value) {
  return `relationship-${value}`;
}

function defaultMembers() {
  return [
    { id: "father", role: "아빠", name: "옥호성", loginId: "netpromise" },
    { id: "mother", role: "엄마", name: "이건화", loginId: "kuna00" },
    { id: "son1", role: "큰아들", name: "옥승현", loginId: "hyeon1" },
    { id: "son2", role: "작은아들", name: "옥수현", loginId: "hyeon2" },
    { id: "son3", role: "셋째아들", name: "옥서현", loginId: "hyeon3" },
    { id: "daughter1", role: "막내딸", name: "옥소현", loginId: "hyeon4" },
  ];
}

function seedState(startDate = defaultCycleStartDate()) {
  return {
    cycleId: cycleIdFromDate(startDate),
    cycleName: cycleNameFromDate(startDate),
    cycleStartDate: startDate,
    mission: "사회에 기여하는 사람이 되자.",
    members: defaultMembers(),
    selfReflections: [],
    feedbacks: [],
    commitments: [],
  };
}

function normalizeState(candidate) {
  if (!candidate || !Array.isArray(candidate.feedbacks)) return seedState();
  const cycleStartDate = candidate.cycleStartDate || defaultCycleStartDate();
  const cycleId = candidate.cycleId || cycleIdFromDate(cycleStartDate);
  return {
    cycleId,
    cycleName: candidate.cycleName || cycleNameFromDate(cycleStartDate),
    cycleStartDate,
    mission: candidate.mission || "사회에 기여하는 사람이 되자.",
    members: normalizeMembers(candidate.members),
    selfReflections: Array.isArray(candidate.selfReflections)
      ? candidate.selfReflections.map((item) => ({ ...normalizeSelfReflection(item), cycleId: item.cycleId || cycleId }))
      : [],
    feedbacks: candidate.feedbacks.map((feedback) => ({ ...normalizeFeedback(feedback), cycleId: feedback.cycleId || cycleId })),
    commitments: Array.isArray(candidate.commitments)
      ? candidate.commitments.map((commitment) => ({
          ...normalizeCommitment(commitment),
          cycleId: commitment.cycleId || cycleId,
        }))
      : [],
  };
}

function normalizeMembers(members) {
  const defaults = defaultMembers();
  if (!Array.isArray(members)) return defaults;
  return defaults.map((member) => ({
    ...member,
    ...(members.find((item) => item.id === member.id) || {}),
  }));
}

function normalizeSelfReflection(item) {
  return {
    id: item.id || uid(),
    cycleId: item.cycleId || "",
    memberId: item.memberId || "father",
    category: SELF_REFLECTION_META[item.category] ? item.category : "strength",
    text: item.text || "",
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
  };
}

function normalizeFeedback(feedback) {
  return {
    id: feedback.id || uid(),
    cycleId: feedback.cycleId || "",
    authorId: feedback.authorId || "father",
    recipientId: feedback.recipientId || "mother",
    category: CATEGORY_META[feedback.category] ? feedback.category : "strength",
    text: feedback.text || "",
    createdAt: feedback.createdAt || new Date().toISOString(),
    updatedAt: feedback.updatedAt || feedback.createdAt || new Date().toISOString(),
  };
}

function normalizeCommitment(commitment) {
  return {
    id: commitment.id || uid(),
    cycleId: commitment.cycleId || "",
    memberId: commitment.memberId || "father",
    sourceFeedbackId: commitment.sourceFeedbackId || "",
    authorId: commitment.authorId || "",
    category: commitment.category === "challenge" ? "challenge" : "improve",
    text: commitment.text || "",
    plan: commitment.plan || "",
    progress: clampPercent(Number(commitment.progress || 0)),
    createdAt: commitment.createdAt || new Date().toISOString(),
    updatedAt: commitment.updatedAt || commitment.createdAt || new Date().toISOString(),
  };
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return seedState();
  try {
    return normalizeState(JSON.parse(saved));
  } catch {
    return seedState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (!applyingRemoteState) scheduleRemoteSave();
}

function supabaseEndpoint(table, query = "") {
  return `${SUPABASE_URL}/rest/v1/${table}${query}`;
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    ...extra,
  };
}

function setSyncStatus(message, tone = "pending") {
  elements.syncStatus.textContent = message;
  elements.syncStatus.dataset.tone = tone;
}

async function fetchRemoteState() {
  const response = await fetch(
    supabaseEndpoint(SUPABASE_STATE_TABLE, `?id=eq.${encodeURIComponent(SUPABASE_ROW_ID)}&select=id,data,updated_at`),
    { headers: supabaseHeaders() },
  );
  if (!response.ok) throw new Error(await response.text());
  const rows = await response.json();
  return rows[0] || null;
}

async function pushRemoteState() {
  remoteSaving = true;
  setSyncStatus("공유 저장 중");
  try {
    const response = await fetch(supabaseEndpoint(SUPABASE_STATE_TABLE, "?on_conflict=id"), {
      method: "POST",
      headers: supabaseHeaders({
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      }),
      body: JSON.stringify([{ id: SUPABASE_ROW_ID, data: state }]),
    });
    if (!response.ok) throw new Error(await response.text());
    const rows = await response.json();
    remoteUpdatedAt = rows[0]?.updated_at || new Date().toISOString();
    setSyncStatus("가족과 공유됨", "ok");
  } catch (error) {
    console.error(error);
    setSyncStatus("내 기기에만 저장 중", "error");
  } finally {
    remoteSaving = false;
  }
}

function scheduleRemoteSave() {
  setSyncStatus("저장 대기 중");
  window.clearTimeout(remoteSaveTimer);
  remoteSaveTimer = window.setTimeout(() => {
    remoteSaveTimer = null;
    pushRemoteState();
  }, 600);
}

function applyRemoteState(remoteData, updatedAt) {
  applyingRemoteState = true;
  state = normalizeState(remoteData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  applyingRemoteState = false;
  remoteUpdatedAt = updatedAt || remoteUpdatedAt;
  ensureSession();
  render();
  setSyncStatus("가족과 공유됨", "ok");
}

async function pullRemoteState() {
  if (remoteSaveTimer || remoteSaving) return;
  try {
    const remote = await fetchRemoteState();
    if (!remote) {
      await pushRemoteState();
      return;
    }
    if (remote.updated_at && remote.updated_at !== remoteUpdatedAt) {
      applyRemoteState(remote.data, remote.updated_at);
    }
  } catch (error) {
    console.error(error);
    setSyncStatus("공유 저장소 연결 필요", "error");
  }
}

async function fetchArchives() {
  try {
    const response = await fetch(
      supabaseEndpoint(
        SUPABASE_ARCHIVE_TABLE,
        "?select=id,cycle_name,cycle_start_date,archived_at,data&order=cycle_start_date.desc",
      ),
      { headers: supabaseHeaders() },
    );
    if (!response.ok) throw new Error(await response.text());
    archives = await response.json();
    renderArchives();
  } catch (error) {
    console.error(error);
    elements.archiveList.innerHTML = emptyState(
      "지난 기록 저장소 연결이 필요해요",
      "Supabase에서 최신 setup.sql을 실행하면 사용할 수 있어요.",
    );
  }
}

async function initRemoteSync() {
  setSyncStatus("공유 저장소 연결 중");
  try {
    const remote = await fetchRemoteState();
    if (remote?.data?.feedbacks) {
      applyRemoteState(remote.data, remote.updated_at);
    } else {
      await pushRemoteState();
    }
    await fetchArchives();
    window.addEventListener("focus", pullRemoteState);
    window.setInterval(() => {
      pullRemoteState();
      fetchArchives();
    }, 12000);
  } catch (error) {
    console.error(error);
    setSyncStatus("공유 저장소 연결 필요", "error");
    showToast("Supabase 연결 설정이 필요해요.");
  }
}

function memberById(memberId) {
  return state.members.find((member) => member.id === memberId) || state.members[0];
}

function currentMember() {
  return currentMemberId ? memberById(currentMemberId) : null;
}

function memberLabel(member) {
  return `${member.role} · ${member.name}`;
}

function isParent(memberId) {
  return memberId === "father" || memberId === "mother";
}

function loginMember(loginId, password) {
  const normalizedId = loginId.trim().toLowerCase();
  const member = state.members.find((item) => item.loginId.toLowerCase() === normalizedId);
  if (!member || password !== FAMILY_PASSWORD) {
    showToast("아이디 또는 비밀번호를 확인해주세요.");
    return;
  }
  currentMemberId = member.id;
  activeRecipientId = state.members.find((item) => item.id !== currentMemberId)?.id || null;
  currentView = "self";
  localStorage.setItem(SESSION_KEY, currentMemberId);
  localStorage.setItem(VIEW_KEY, currentView);
  elements.loginForm.reset();
  render();
}

function logout() {
  currentMemberId = null;
  activeRecipientId = null;
  localStorage.removeItem(SESSION_KEY);
  render();
}

function ensureSession() {
  if (currentMemberId && !state.members.some((member) => member.id === currentMemberId)) {
    logout();
    return;
  }
  if (currentMemberId && (!activeRecipientId || activeRecipientId === currentMemberId)) {
    activeRecipientId = state.members.find((member) => member.id !== currentMemberId)?.id || null;
  }
}

function setView(view) {
  if (!["self", "write", "received", "commitments", "overview"].includes(view)) return;
  currentView = view;
  localStorage.setItem(VIEW_KEY, currentView);
  renderViewVisibility();
}

function currentSelfReflections(memberId = currentMemberId) {
  return state.selfReflections.filter((item) => item.cycleId === state.cycleId && item.memberId === memberId);
}

function currentFeedbacks() {
  return state.feedbacks.filter((item) => item.cycleId === state.cycleId);
}

function feedbacksByAuthor(authorId) {
  return currentFeedbacks().filter((item) => item.authorId === authorId);
}

function receivedFeedbacks(memberId) {
  return currentFeedbacks().filter((item) => item.recipientId === memberId);
}

function activeCommitments(memberId = currentMemberId) {
  return state.commitments.filter((item) => item.cycleId === state.cycleId && item.memberId === memberId);
}

function feedbackCount(authorId, recipientId, category) {
  return currentFeedbacks().filter(
    (item) => item.authorId === authorId && item.recipientId === recipientId && item.category === category,
  ).length;
}

function feedbackProgress(memberId) {
  const recipients = state.members.filter((member) => member.id !== memberId);
  const selfCompleted = Object.keys(SELF_REFLECTION_META).filter((category) =>
    currentSelfReflections(memberId).some((item) => item.category === category),
  ).length;
  const completedSlots = recipients.reduce(
    (total, recipient) =>
      total +
      Object.keys(CATEGORY_META).filter((category) => feedbackCount(memberId, recipient.id, category) > 0).length,
    0,
  );
  const totalSlots = recipients.length * Object.keys(CATEGORY_META).length + Object.keys(SELF_REFLECTION_META).length;
  return Math.round(((completedSlots + selfCompleted) / totalSlots) * 100);
}

function averageCommitmentProgress(memberId) {
  const items = activeCommitments(memberId);
  if (!items.length) return 0;
  return Math.round(items.reduce((sum, item) => sum + item.progress, 0) / items.length);
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function render() {
  ensureSession();
  const loggedIn = Boolean(currentMemberId);
  elements.loginShell.hidden = loggedIn;
  elements.appShell.hidden = !loggedIn;
  if (!loggedIn) return;

  const member = currentMember();
  const progress = feedbackProgress(member.id);
  const selfReflections = currentSelfReflections(member.id);
  const received = receivedFeedbacks(member.id);
  const commitments = activeCommitments(member.id);
  elements.pageTitle.textContent = `${member.role} ${member.name}의 관계 점검`;
  elements.cycleCaption.textContent = `${state.cycleName} · ${formatCyclePeriod()}`;
  elements.myFeedbackProgress.textContent = `${progress}%`;
  elements.myFeedbackProgressBar.style.width = `${progress}%`;
  elements.selfBadge.textContent = selfReflections.length;
  elements.receivedBadge.textContent = received.length;
  elements.commitmentBadge.textContent = commitments.length;
  elements.cycleActions.hidden = !isParent(member.id);

  renderViewVisibility();
  renderSelfReflections();
  renderRecipientTabs();
  renderFeedbackEditor();
  renderReceived();
  renderCommitments();
  renderFamilyOverview();
  renderArchives();
}

function renderViewVisibility() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.setAttribute("aria-selected", String(button.dataset.view === currentView));
  });
  document.querySelectorAll("[data-view-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.viewPanel !== currentView;
  });
}

function renderSelfReflections() {
  elements.selfReflectionEditor.innerHTML = Object.entries(SELF_REFLECTION_META)
    .map(([category, meta]) => {
      const items = currentSelfReflections()
        .filter((item) => item.category === category)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return `
        <section class="self-reflection-column" data-tone="${meta.tone}">
          <div class="self-reflection-heading">
            <div>
              <span>나에게 묻기</span>
              <h3>${escapeHTML(meta.label)}</h3>
            </div>
            <strong>${items.length}/${SELF_REFLECTION_LIMIT}</strong>
          </div>
          <p>${escapeHTML(meta.description)}</p>
          <form class="self-reflection-form" data-category="${category}">
            <textarea rows="3" maxlength="200" placeholder="${escapeHTML(meta.placeholder)}" ${items.length >= SELF_REFLECTION_LIMIT ? "disabled" : ""} required></textarea>
            <button class="primary-button" type="submit" ${items.length >= SELF_REFLECTION_LIMIT ? "disabled" : ""}>나의 이야기 추가</button>
          </form>
          <div class="self-reflection-list">
            ${
              items.length
                ? items
                    .map(
                      (item, index) => `
                        <article class="self-reflection-item">
                          <span>${index + 1}</span>
                          <p>${escapeHTML(item.text)}</p>
                          <button class="icon-text-button delete-self-reflection" type="button" data-self-reflection-id="${item.id}" aria-label="나의 이야기 삭제">삭제</button>
                        </article>
                      `,
                    )
                    .join("")
                : emptyState("아직 적은 내용이 없어요", "나를 따뜻하게 바라보는 한 문장부터 시작해보세요.")
            }
          </div>
        </section>
      `;
    })
    .join("");
}

function renderRecipientTabs() {
  const recipients = state.members.filter((member) => member.id !== currentMemberId);
  elements.recipientTabs.innerHTML = recipients
    .map((member) => {
      const completed = Object.keys(CATEGORY_META).filter(
        (category) => feedbackCount(currentMemberId, member.id, category) > 0,
      ).length;
      return `
        <button type="button" data-recipient-id="${member.id}" aria-selected="${member.id === activeRecipientId}">
          <span>${escapeHTML(member.role)}</span>
          <strong>${escapeHTML(member.name)}</strong>
          <small>${completed}/3 작성</small>
        </button>
      `;
    })
    .join("");
}

function renderFeedbackEditor() {
  const recipient = memberById(activeRecipientId);
  elements.feedbackEditor.innerHTML = Object.entries(CATEGORY_META)
    .map(([category, meta]) => {
      const items = currentFeedbacks()
        .filter(
          (item) =>
            item.authorId === currentMemberId && item.recipientId === activeRecipientId && item.category === category,
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return `
        <section class="feedback-column" data-tone="${meta.tone}">
          <div class="feedback-column-heading">
            <div>
              <span>${escapeHTML(recipient.name)}에게</span>
              <h3>${escapeHTML(meta.label)}</h3>
            </div>
            <strong>${items.length}/${FEEDBACK_LIMIT}</strong>
          </div>
          <p>${escapeHTML(meta.description)}</p>
          <form class="feedback-form" data-category="${category}">
            <textarea rows="3" maxlength="180" placeholder="구체적인 장면이나 행동을 중심으로 적어보세요." ${items.length >= FEEDBACK_LIMIT ? "disabled" : ""} required></textarea>
            <button class="primary-button" type="submit" ${items.length >= FEEDBACK_LIMIT ? "disabled" : ""}>항목 추가</button>
          </form>
          <div class="feedback-item-list">
            ${
              items.length
                ? items
                    .map(
                      (item, index) => `
                        <article class="feedback-item">
                          <span>${index + 1}</span>
                          <p>${escapeHTML(item.text)}</p>
                          <button class="icon-text-button delete-feedback" type="button" data-feedback-id="${item.id}" aria-label="피드백 삭제">삭제</button>
                        </article>
                      `,
                    )
                    .join("")
                : emptyState("아직 작성한 내용이 없어요", "한 가지 구체적인 마음부터 전해보세요.")
            }
          </div>
        </section>
      `;
    })
    .join("");
}

function renderReceived() {
  const items = receivedFeedbacks(currentMemberId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const counts = Object.keys(CATEGORY_META).map(
    (category) => items.filter((item) => item.category === category).length,
  );
  elements.receivedSummary.innerHTML = Object.entries(CATEGORY_META)
    .map(
      ([category, meta], index) => `
        <article data-tone="${meta.tone}">
          <span>${escapeHTML(meta.shortLabel)}</span>
          <strong>${counts[index]}</strong>
        </article>
      `,
    )
    .join("");

  if (!items.length) {
    elements.receivedList.innerHTML = emptyState(
      "아직 도착한 이야기가 없어요",
      "가족이 내용을 작성하면 이 화면에서 확인할 수 있어요.",
    );
    return;
  }

  elements.receivedList.innerHTML = Object.entries(CATEGORY_META)
    .map(([category, meta]) => {
      const categoryItems = items.filter((item) => item.category === category);
      if (!categoryItems.length) return "";
      return `
        <section class="received-group">
          <div class="received-group-heading" data-tone="${meta.tone}">
            <h3>${escapeHTML(meta.label)}</h3>
            <span>${categoryItems.length}개</span>
          </div>
          <div class="received-card-grid">
            ${categoryItems
              .map((item) => {
                const author = memberById(item.authorId);
                const commitment = activeCommitments().find((entry) => entry.sourceFeedbackId === item.id);
                return `
                  <article class="received-card" data-tone="${meta.tone}">
                    <p>${escapeHTML(item.text)}</p>
                    <footer>
                      <span>${escapeHTML(author.role)} · ${escapeHTML(author.name)}</span>
                      ${
                        category === "strength"
                          ? `<strong>고마운 마음으로 간직하기</strong>`
                          : `
                            <label class="commitment-toggle">
                              <input class="toggle-commitment" type="checkbox" data-feedback-id="${item.id}" ${commitment ? "checked" : ""} />
                              <span>3개월 실천으로 선택</span>
                            </label>
                          `
                      }
                    </footer>
                  </article>
                `;
              })
              .join("")}
          </div>
        </section>
      `;
    })
    .join("");
}

function renderCommitments() {
  const items = activeCommitments().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const average = averageCommitmentProgress(currentMemberId);
  elements.commitmentOverview.innerHTML = `
    <div>
      <span>선택한 실천</span>
      <strong>${items.length}개</strong>
    </div>
    <div>
      <span>평균 진행률</span>
      <strong>${average}%</strong>
    </div>
    <div class="overview-progress">
      <span>3개월 실천 진행</span>
      <div class="progress-track"><span style="width: ${average}%"></span></div>
    </div>
  `;

  if (!items.length) {
    elements.commitmentList.innerHTML = emptyState(
      "아직 선택한 실천이 없어요",
      "받은 이야기에서 개선 또는 도전 항목을 선택해보세요.",
    );
    return;
  }

  elements.commitmentList.innerHTML = items
    .map((item, index) => {
      const author = memberById(item.authorId);
      const meta = CATEGORY_META[item.category];
      return `
        <article class="commitment-card" data-commitment-id="${item.id}">
          <div class="commitment-number">${index + 1}</div>
          <div class="commitment-body">
            <div class="commitment-heading">
              <div>
                <span data-tone="${meta.tone}">${escapeHTML(meta.shortLabel)}</span>
                <h3>${escapeHTML(item.text)}</h3>
                <p>${escapeHTML(author.role)} ${escapeHTML(author.name)}의 이야기</p>
              </div>
              <strong class="commitment-progress-value">${item.progress}%</strong>
            </div>
            <label>
              3개월 동안 실천할 작은 계획
              <textarea class="commitment-plan" rows="3" maxlength="240" placeholder="언제, 어디서, 어떤 행동부터 시작할지 적어보세요.">${escapeHTML(item.plan)}</textarea>
            </label>
            <div class="range-control">
              <label for="progress-${item.id}">현재 진행률</label>
              <input id="progress-${item.id}" class="commitment-progress" type="range" min="0" max="100" step="10" value="${item.progress}" style="--progress: ${item.progress}%" />
            </div>
          </div>
          <button class="icon-text-button remove-commitment" type="button" data-commitment-id="${item.id}">선택 해제</button>
        </article>
      `;
    })
    .join("");
}

function renderFamilyOverview() {
  elements.familyOverview.innerHTML = state.members
    .map((member) => {
      const selfReflectionCount = currentSelfReflections(member.id).length;
      const given = feedbacksByAuthor(member.id).length;
      const progress = feedbackProgress(member.id);
      const commitments = activeCommitments(member.id);
      const practiceProgress = averageCommitmentProgress(member.id);
      return `
        <article class="member-overview-card">
          <div class="member-overview-heading">
            <div>
              <span>${escapeHTML(member.role)}</span>
              <h3>${escapeHTML(member.name)}</h3>
            </div>
            <strong>${progress}%</strong>
          </div>
          <div class="progress-track"><span style="width: ${progress}%"></span></div>
          <dl>
            <div><dt>나의 이야기</dt><dd>${selfReflectionCount}개</dd></div>
            <div><dt>작성한 이야기</dt><dd>${given}개</dd></div>
            <div><dt>선택한 실천</dt><dd>${commitments.length}개</dd></div>
            <div><dt>실천 진행률</dt><dd>${practiceProgress}%</dd></div>
          </dl>
        </article>
      `;
    })
    .join("");
}

function renderArchives() {
  if (!archives.length) {
    elements.archiveList.innerHTML = emptyState(
      "아직 보관된 관계 점검이 없어요",
      "부모 계정에서 현재 기록을 보관하면 여기에 표시됩니다.",
    );
    return;
  }
  elements.archiveList.innerHTML = archives
    .map((archive) => {
      const archivedState = normalizeState(archive.data);
      const selfReflectionCount = archivedState.selfReflections.length;
      const feedbackCount = archivedState.feedbacks.length;
      const commitmentCount = archivedState.commitments.length;
      return `
        <article class="archive-card">
          <div>
            <h4>${escapeHTML(archive.cycle_name)}</h4>
            <p>나의 이야기 ${selfReflectionCount}개 · 가족 이야기 ${feedbackCount}개 · 3개월 실천 ${commitmentCount}개</p>
            <span>${escapeHTML(formatDateTime(archive.archived_at))} 보관</span>
          </div>
          <button class="secondary-button download-archive" type="button" data-archive-id="${archive.id}">기록 받기</button>
        </article>
      `;
    })
    .join("");
}

function addSelfReflection(category, text) {
  const items = currentSelfReflections().filter((item) => item.category === category);
  if (items.length >= SELF_REFLECTION_LIMIT) {
    showToast("항목별로 5개까지 작성할 수 있어요.");
    return;
  }
  const now = new Date().toISOString();
  state.selfReflections.push({
    id: uid(),
    cycleId: state.cycleId,
    memberId: currentMemberId,
    category,
    text: text.trim(),
    createdAt: now,
    updatedAt: now,
  });
  saveState();
  render();
  showToast("나의 이야기를 저장했어요.");
}

function deleteSelfReflection(itemId) {
  const item = state.selfReflections.find((entry) => entry.id === itemId);
  if (!item || item.memberId !== currentMemberId) return;
  state.selfReflections = state.selfReflections.filter((entry) => entry.id !== itemId);
  saveState();
  render();
  showToast("나의 이야기를 삭제했어요.");
}

function addFeedback(category, text) {
  const count = feedbackCount(currentMemberId, activeRecipientId, category);
  if (count >= FEEDBACK_LIMIT) {
    showToast("항목별로 5개까지 작성할 수 있어요.");
    return;
  }
  const now = new Date().toISOString();
  state.feedbacks.push({
    id: uid(),
    cycleId: state.cycleId,
    authorId: currentMemberId,
    recipientId: activeRecipientId,
    category,
    text: text.trim(),
    createdAt: now,
    updatedAt: now,
  });
  saveState();
  render();
  showToast("가족에게 전할 이야기를 저장했어요.");
}

function deleteFeedback(feedbackId) {
  const feedback = state.feedbacks.find((item) => item.id === feedbackId);
  if (!feedback || feedback.authorId !== currentMemberId) return;
  state.feedbacks = state.feedbacks.filter((item) => item.id !== feedbackId);
  state.commitments = state.commitments.filter((item) => item.sourceFeedbackId !== feedbackId);
  saveState();
  render();
  showToast("항목을 삭제했어요.");
}

function toggleCommitment(feedbackId, selected) {
  const feedback = state.feedbacks.find(
    (item) => item.id === feedbackId && item.recipientId === currentMemberId && item.category !== "strength",
  );
  if (!feedback) return;
  const existing = state.commitments.find(
    (item) => item.memberId === currentMemberId && item.sourceFeedbackId === feedbackId,
  );
  if (selected && !existing) {
    const now = new Date().toISOString();
    state.commitments.push({
      id: uid(),
      cycleId: state.cycleId,
      memberId: currentMemberId,
      sourceFeedbackId: feedback.id,
      authorId: feedback.authorId,
      category: feedback.category,
      text: feedback.text,
      plan: "",
      progress: 0,
      createdAt: now,
      updatedAt: now,
    });
  }
  if (!selected && existing) {
    state.commitments = state.commitments.filter((item) => item.id !== existing.id);
  }
  saveState();
  render();
}

function updateCommitmentFromEvent(event) {
  const card = event.target.closest("[data-commitment-id]");
  const commitment = state.commitments.find((item) => item.id === card?.dataset.commitmentId);
  if (!commitment || commitment.memberId !== currentMemberId) return;
  if (event.target.matches(".commitment-plan")) {
    commitment.plan = event.target.value;
  }
  if (event.target.matches(".commitment-progress")) {
    commitment.progress = clampPercent(Number(event.target.value));
    event.target.style.setProperty("--progress", `${commitment.progress}%`);
    card.querySelector(".commitment-progress-value").textContent = `${commitment.progress}%`;
  }
  commitment.updatedAt = new Date().toISOString();
  saveState();
  renderCommitmentSummaryOnly();
}

function renderCommitmentSummaryOnly() {
  const items = activeCommitments();
  const average = averageCommitmentProgress(currentMemberId);
  const values = elements.commitmentOverview.querySelectorAll("strong");
  if (values[0]) values[0].textContent = `${items.length}개`;
  if (values[1]) values[1].textContent = `${average}%`;
  const bar = elements.commitmentOverview.querySelector(".progress-track span");
  if (bar) bar.style.width = `${average}%`;
}

async function archiveCurrentCycle(showToastMessage = true) {
  setSyncStatus("현재 기록 보관 중");
  const response = await fetch(supabaseEndpoint(SUPABASE_ARCHIVE_TABLE, "?on_conflict=id"), {
    method: "POST",
    headers: supabaseHeaders({
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    }),
    body: JSON.stringify([
      {
        id: state.cycleId,
        cycle_name: state.cycleName,
        cycle_start_date: state.cycleStartDate,
        data: state,
      },
    ]),
  });
  if (!response.ok) throw new Error(await response.text());
  await fetchArchives();
  setSyncStatus("가족과 공유됨", "ok");
  if (showToastMessage) showToast("현재 관계 점검 기록을 보관했어요.");
}

async function startNextCycle() {
  if (!isParent(currentMemberId)) return;
  if (!window.confirm("현재 기록을 보관하고 새로운 3개월 관계 점검을 시작할까요?")) return;
  try {
    await archiveCurrentCycle(false);
    const nextStart = formatDateInput(addMonths(new Date(`${state.cycleStartDate}T00:00:00`), 3));
    state = seedState(nextStart);
    activeRecipientId = state.members.find((member) => member.id !== currentMemberId)?.id || null;
    saveState();
    await pushRemoteState();
    render();
    showToast("새로운 3개월 관계 점검을 시작했어요.");
  } catch (error) {
    console.error(error);
    setSyncStatus("새 주기 시작 실패", "error");
    showToast("기록 보관 중 문제가 생겼어요.");
  }
}

function formatCyclePeriod() {
  const start = new Date(`${state.cycleStartDate}T00:00:00`);
  const end = addMonths(start, 3);
  end.setDate(end.getDate() - 1);
  return `${formatDate(start)} ~ ${formatDate(end)}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emptyState(title, text) {
  return `
    <div class="empty-state">
      <strong>${escapeHTML(title)}</strong>
      <p>${escapeHTML(text)}</p>
    </div>
  `;
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), 2200);
}

elements.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loginMember(elements.loginId.value, elements.loginPassword.value);
});

elements.logoutButton.addEventListener("click", logout);

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    setView(viewButton.dataset.view);
    return;
  }

  const recipientButton = event.target.closest("[data-recipient-id]");
  if (recipientButton) {
    activeRecipientId = recipientButton.dataset.recipientId;
    renderRecipientTabs();
    renderFeedbackEditor();
    return;
  }

  const deleteButton = event.target.closest(".delete-feedback");
  if (deleteButton) {
    deleteFeedback(deleteButton.dataset.feedbackId);
    return;
  }

  const deleteSelfButton = event.target.closest(".delete-self-reflection");
  if (deleteSelfButton) {
    deleteSelfReflection(deleteSelfButton.dataset.selfReflectionId);
    return;
  }

  const removeCommitmentButton = event.target.closest(".remove-commitment");
  if (removeCommitmentButton) {
    const commitment = state.commitments.find((item) => item.id === removeCommitmentButton.dataset.commitmentId);
    if (commitment) toggleCommitment(commitment.sourceFeedbackId, false);
    return;
  }

  const downloadButton = event.target.closest(".download-archive");
  if (downloadButton) {
    const archive = archives.find((item) => item.id === downloadButton.dataset.archiveId);
    if (!archive) return;
    const blob = new Blob([JSON.stringify(archive.data, null, 2)], { type: "application/json" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${archive.cycle_name.replace(/[^\w가-힣-]+/g, "-")}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(anchor.href);
  }
});

document.addEventListener("submit", (event) => {
  const selfForm = event.target.closest(".self-reflection-form");
  if (selfForm) {
    event.preventDefault();
    const textarea = selfForm.querySelector("textarea");
    const text = textarea.value.trim();
    if (!text) return;
    addSelfReflection(selfForm.dataset.category, text);
    return;
  }

  const form = event.target.closest(".feedback-form");
  if (!form) return;
  event.preventDefault();
  const textarea = form.querySelector("textarea");
  const text = textarea.value.trim();
  if (!text) return;
  addFeedback(form.dataset.category, text);
});

document.addEventListener("change", (event) => {
  if (event.target.matches(".toggle-commitment")) {
    toggleCommitment(event.target.dataset.feedbackId, event.target.checked);
  }
});

elements.commitmentList.addEventListener("input", updateCommitmentFromEvent);

elements.archiveCycleButton.addEventListener("click", async () => {
  if (!isParent(currentMemberId)) return;
  try {
    await archiveCurrentCycle();
  } catch (error) {
    console.error(error);
    setSyncStatus("기록 보관 실패", "error");
    showToast("기록을 보관하지 못했어요.");
  }
});

elements.startNextCycleButton.addEventListener("click", startNextCycle);

render();
initRemoteSync();
