const STORAGE_KEY = "oklee-family-relationship-v1";
const SESSION_KEY = "oklee-family-relationship-session-v1";
const VIEW_KEY = "oklee-family-relationship-view-v2";
const WELCOME_KEY = "oklee-family-heart-note-welcome-v1";
const SUPABASE_URL = "https://laquzdfgwtxkcuxzvesg.supabase.co";
const SUPABASE_KEY = "sb_publishable_afRB9ccJ23fNekWd8m3ibA_uZiYUTmo";
const SUPABASE_STATE_TABLE = "family_relationship_state";
const SUPABASE_ARCHIVE_TABLE = "family_relationship_cycles";
const SUPABASE_ROW_ID = "oklee-family-relationship";
const FAMILY_PASSWORD = "hyeon00#";
const FEEDBACK_LIMIT = 5;
const SELF_REFLECTION_LIMIT = 5;

const SELF_REFLECTION_META = {
  care: {
    label: "요즘 내가 가족을 위해 애쓴 것은 무엇인가요?",
    description: "크거나 특별하지 않아도 괜찮아요. 하나만 적어도 충분해요.",
    placeholder: "예: 피곤해도 가족에게 다정하게 말하려고 노력했어요.",
    tone: "positive",
  },
  heart: {
    label: "가족이 알아주었으면 하는 내 마음은 무엇인가요?",
    description: "가족을 위해 애쓴 마음이 너무 당연하게만 지나가지 않았으면 하는 부분을 적어보세요.",
    placeholder: "예: 나도 잘하고 싶은 마음이 있는데 가끔 표현이 서툴러요.",
    tone: "recognition",
  },
};

const CATEGORY_META = {
  thanks: {
    label: "이 가족에게 고마웠던 점",
    shortLabel: "고마운 마음",
    description: "고마웠던 장면이나 마음을 떠올려 적어보세요. 하나만 적어도 괜찮아요.",
    tone: "positive",
  },
  doingWell: {
    label: "이 가족이 잘하고 있다고 생각하는 점",
    shortLabel: "잘하고 있어요",
    description: "이 사람이 계속 이어가면 좋겠다고 느낀 모습을 알려주세요.",
    tone: "positive",
  },
  wish: {
    label: "이 가족에게 바라는 작은 변화",
    shortLabel: "바라는 마음",
    description: "상대가 해볼 수 있는 작은 행동으로 부드럽게 적어보세요.",
    tone: "improve",
  },
  together: {
    label: "함께 해보고 싶은 것",
    shortLabel: "함께 하고 싶어요",
    description: "같이 해보면 좋을 일이나 시간을 적어보세요.",
    tone: "challenge",
  },
};

const ACTIONABLE_CATEGORIES = ["wish", "together"];

const PRACTICE_STEPS = [
  { value: 0, label: "아직 시작 전" },
  { value: 25, label: "조금 시작했어요" },
  { value: 50, label: "절반 정도 해봤어요" },
  { value: 75, label: "꽤 잘하고 있어요" },
  { value: 100, label: "약속을 잘 지켰어요" },
];

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
  recipientSelfContext: document.querySelector("#recipientSelfContext"),
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
  welcomeModal: document.querySelector("#welcomeModal"),
  welcomeStartButton: document.querySelector("#welcomeStartButton"),
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
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 가족 마음 나누기`;
}

function cycleIdFromDate(value) {
  return `heart-note-${value}`;
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
  const cycleName = candidate.cycleName && !candidate.cycleName.includes("관계 점검")
    ? candidate.cycleName
    : cycleNameFromDate(cycleStartDate);
  return {
    cycleId,
    cycleName,
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
  const categoryMap = {
    strength: "care",
    recognition: "heart",
  };
  const category = SELF_REFLECTION_META[item.category] ? item.category : categoryMap[item.category] || "care";
  return {
    id: item.id || uid(),
    cycleId: item.cycleId || "",
    memberId: item.memberId || "father",
    category,
    text: item.text || "",
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
  };
}

function normalizeFeedback(feedback) {
  const categoryMap = {
    strength: "doingWell",
    improve: "wish",
    challenge: "together",
  };
  const category = CATEGORY_META[feedback.category] ? feedback.category : categoryMap[feedback.category] || "thanks";
  return {
    id: feedback.id || uid(),
    cycleId: feedback.cycleId || "",
    authorId: feedback.authorId || "father",
    recipientId: feedback.recipientId || "mother",
    category,
    text: feedback.text || "",
    createdAt: feedback.createdAt || new Date().toISOString(),
    updatedAt: feedback.updatedAt || feedback.createdAt || new Date().toISOString(),
  };
}

function normalizeCommitment(commitment) {
  const categoryMap = {
    improve: "wish",
    challenge: "together",
  };
  const category = ACTIONABLE_CATEGORIES.includes(commitment.category)
    ? commitment.category
    : categoryMap[commitment.category] || "wish";
  return {
    id: commitment.id || uid(),
    cycleId: commitment.cycleId || "",
    memberId: commitment.memberId || "father",
    sourceFeedbackId: commitment.sourceFeedbackId || "",
    authorId: commitment.authorId || "",
    category,
    text: commitment.text || "",
    reason: commitment.reason || "",
    plan: commitment.plan || "",
    support: commitment.support || "",
    weeklyLog: commitment.weeklyLog || "",
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
  showWelcomeModalOnce();
}

function logout() {
  currentMemberId = null;
  activeRecipientId = null;
  localStorage.removeItem(SESSION_KEY);
  render();
}

function showWelcomeModalOnce() {
  if (!elements.welcomeModal || localStorage.getItem(WELCOME_KEY) === "seen") return;
  elements.welcomeModal.hidden = false;
  elements.welcomeStartButton?.focus();
}

function closeWelcomeModal() {
  localStorage.setItem(WELCOME_KEY, "seen");
  if (elements.welcomeModal) elements.welcomeModal.hidden = true;
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

function progressLabel(value) {
  const progress = clampPercent(value);
  return PRACTICE_STEPS.reduce((closest, step) =>
    Math.abs(step.value - progress) < Math.abs(closest.value - progress) ? step : closest,
  ).label;
}

function nearestPracticeStep(value) {
  const progress = clampPercent(value);
  return PRACTICE_STEPS.reduce((closest, step) =>
    Math.abs(step.value - progress) < Math.abs(closest.value - progress) ? step : closest,
  ).value;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function feedbackPlaceholder(category) {
  const placeholders = {
    thanks: "예: 엄마가 밥 챙겨줘서 고마웠어요.",
    doingWell: "예: 아빠가 놀아줘서 좋았어요.",
    wish: "예: 형이 화낼 때 조금 무서웠어요.",
    together: "예: 동생이 내 물건을 만지기 전에 물어봐주면 좋겠어요.",
  };
  return placeholders[category] || "예: 나는 앞으로 말하기 전에 한 번 생각해볼게요.";
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
  elements.pageTitle.textContent = `${member.role} ${member.name}의 마음노트`;
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
  renderRecipientSelfContext();
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
            <strong>${items.length ? `${items.length}개` : "선택"}</strong>
          </div>
          <p>${escapeHTML(meta.description)}</p>
          <form class="self-reflection-form" data-category="${category}">
            <textarea rows="3" maxlength="200" placeholder="${escapeHTML(meta.placeholder)}" ${items.length >= SELF_REFLECTION_LIMIT ? "disabled" : ""} required></textarea>
            <button class="primary-button" type="submit" ${items.length >= SELF_REFLECTION_LIMIT ? "disabled" : ""}>내 마음 저장하기</button>
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
                : ""
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
          <small>${completed ? "마음 전하는 중" : "아직 전하기 전"}</small>
        </button>
      `;
    })
    .join("");
}

function renderRecipientSelfContext() {
  const recipient = memberById(activeRecipientId);
  const items = currentSelfReflections(recipient.id);

  elements.recipientSelfContext.innerHTML = `
    <div class="recipient-self-context-heading">
      <div>
        <p class="eyebrow">Before Feedback</p>
        <h3>${escapeHTML(recipient.name)}님이 먼저 들려준 마음</h3>
      </div>
      <span>${items.length ? "읽어보기" : "기다리는 중"}</span>
    </div>
    <p class="recipient-self-context-guide">상대가 어떤 마음으로 지내왔는지 먼저 읽고, 따뜻하게 이야기를 전해보세요.</p>
    <div class="recipient-self-context-grid">
      ${Object.entries(SELF_REFLECTION_META)
        .map(([category, meta]) => {
          const categoryItems = items.filter((item) => item.category === category);
          return `
            <section class="recipient-self-context-group" data-tone="${meta.tone}">
              <h4>${escapeHTML(meta.label)}</h4>
              ${
                categoryItems.length
                  ? `<ul>${categoryItems.map((item) => `<li>${escapeHTML(item.text)}</li>`).join("")}</ul>`
                  : `<p>아직 들려준 마음이 없어요.</p>`
              }
            </section>
          `;
        })
        .join("")}
    </div>
  `;
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
            <strong>${items.length ? `${items.length}개` : "선택"}</strong>
          </div>
          <p>${escapeHTML(meta.description)}</p>
          <form class="feedback-form" data-category="${category}">
            <textarea rows="3" maxlength="180" placeholder="${feedbackPlaceholder(category)}" ${items.length >= FEEDBACK_LIMIT ? "disabled" : ""} required></textarea>
            <button class="primary-button" type="submit" ${items.length >= FEEDBACK_LIMIT ? "disabled" : ""}>따뜻한 이야기 저장</button>
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
                          <button class="icon-text-button delete-feedback" type="button" data-feedback-id="${item.id}" aria-label="이야기 삭제">삭제</button>
                        </article>
                      `,
                    )
                    .join("")
                : emptyState("아직 적은 내용이 없어요", "하나만 적어도 충분해요.")
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
          <strong>${counts[index] ? `${counts[index]}개` : "기다리는 중"}</strong>
        </article>
      `,
    )
    .join("");

  if (!items.length) {
    elements.receivedList.innerHTML = emptyState(
      "아직 도착한 이야기가 없어요",
      "가족이 마음을 전하면 이 화면에서 천천히 읽을 수 있어요.",
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
            <span>${categoryItems.length ? "마음 도착" : ""}</span>
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
                        !ACTIONABLE_CATEGORIES.includes(category)
                          ? `<strong>고마운 말로 저장할래요</strong>`
                          : `
                            <label class="commitment-toggle">
                              <input class="toggle-commitment" type="checkbox" data-feedback-id="${item.id}" ${commitment ? "checked" : ""} />
                              <span>${commitment ? "이번에 해볼래요" : "조금 더 생각해볼래요"}</span>
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
      <span>내가 선택한 작은 약속</span>
      <strong>${items.length}개</strong>
    </div>
    <div>
      <span>지금 상태</span>
      <strong>${progressLabel(average)}</strong>
    </div>
    <div class="overview-progress">
      <span>작은 약속 실천 흐름</span>
      <div class="progress-track"><span style="width: ${average}%"></span></div>
    </div>
  `;

  if (!items.length) {
    elements.commitmentList.innerHTML = emptyState(
      "아직 정한 작은 약속이 없어요",
      "가족이 전한 마음에서 이번에 해볼 수 있는 것 하나를 골라보세요.",
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
              <strong class="commitment-progress-value">${progressLabel(item.progress)}</strong>
            </div>
            <label>
              내가 선택한 작은 약속
              <textarea class="commitment-text" rows="2" maxlength="220" placeholder="이번 3개월 동안 내가 해보고 싶은 작은 약속을 적어보세요.">${escapeHTML(item.text)}</textarea>
            </label>
            <label>
              이 약속을 정한 이유
              <textarea class="commitment-reason" rows="2" maxlength="240" placeholder="왜 이 약속을 해보고 싶은지 적어보세요.">${escapeHTML(item.reason)}</textarea>
            </label>
            <label>
              언제, 어떻게 해볼지
              <textarea class="commitment-plan" rows="3" maxlength="240" placeholder="언제, 어디서, 어떤 행동부터 시작할지 적어보세요.">${escapeHTML(item.plan)}</textarea>
            </label>
            <label>
              가족이 도와주면 좋은 점
              <textarea class="commitment-support" rows="2" maxlength="220" placeholder="가족이 어떻게 도와주면 힘이 날지 적어보세요.">${escapeHTML(item.support)}</textarea>
            </label>
            <label>
              이번 주 실천 기록
              <textarea class="commitment-weekly-log" rows="3" maxlength="260" placeholder="이번 주에 해본 것, 느낀 것을 짧게 남겨보세요.">${escapeHTML(item.weeklyLog)}</textarea>
            </label>
            <div class="range-control">
              <label for="progress-${item.id}">작은 약속 상태 · ${progressLabel(item.progress)}</label>
              <input id="progress-${item.id}" class="commitment-progress" type="range" min="0" max="100" step="25" value="${nearestPracticeStep(item.progress)}" style="--progress: ${item.progress}%" />
            </div>
          </div>
          <button class="icon-text-button remove-commitment" type="button" data-commitment-id="${item.id}">조금 더 생각해볼래요</button>
        </article>
      `;
    })
    .join("");
}

function renderFamilyOverview() {
  elements.familyOverview.innerHTML = state.members
    .map((member) => {
      const selfReflectionCount = currentSelfReflections(member.id).length;
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
            <strong>${progress ? "참여 중" : "시작 전"}</strong>
          </div>
          <div class="progress-track"><span style="width: ${progress}%"></span></div>
          <dl>
            <div><dt>내 마음 돌아보기</dt><dd>${selfReflectionCount ? "참여" : "아직"}</dd></div>
            <div><dt>가족에게 전하기</dt><dd>${feedbacksByAuthor(member.id).length ? "참여" : "아직"}</dd></div>
            <div><dt>작은 약속</dt><dd>${commitments.length ? "정함" : "아직"}</dd></div>
            <div><dt>약속 흐름</dt><dd>${progressLabel(practiceProgress)}</dd></div>
          </dl>
        </article>
      `;
    })
    .join("");
}

function renderArchives() {
  if (!archives.length) {
    elements.archiveList.innerHTML = emptyState(
      "아직 보관된 마음노트가 없어요",
      "부모 계정에서 현재 마음노트를 보관하면 여기에 표시됩니다.",
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
            <p>내 마음 ${selfReflectionCount}개 · 가족 마음 ${feedbackCount}개 · 작은 약속 ${commitmentCount}개</p>
            <span>${escapeHTML(formatDateTime(archive.archived_at))} 보관</span>
          </div>
          <button class="secondary-button download-archive" type="button" data-archive-id="${archive.id}">마음노트 받기</button>
        </article>
      `;
    })
    .join("");
}

function addSelfReflection(category, text) {
  const items = currentSelfReflections().filter((item) => item.category === category);
  if (items.length >= SELF_REFLECTION_LIMIT) {
    showToast("이 질문에는 여기까지 적어둘게요. 충분히 잘 돌아봤어요.");
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
  showToast("내 마음이 저장되었어요. 천천히 잘 돌아봤어요.");
}

function deleteSelfReflection(itemId) {
  const item = state.selfReflections.find((entry) => entry.id === itemId);
  if (!item || item.memberId !== currentMemberId) return;
  state.selfReflections = state.selfReflections.filter((entry) => entry.id !== itemId);
  saveState();
  render();
  showToast("내 마음 기록을 지웠어요.");
}

function addFeedback(category, text) {
  const count = feedbackCount(currentMemberId, activeRecipientId, category);
  if (count >= FEEDBACK_LIMIT) {
    showToast("이 질문에는 여기까지 적어둘게요. 하나만 적어도 충분해요.");
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
  showToast("가족에게 전할 따뜻한 이야기가 저장되었어요.");
}

function deleteFeedback(feedbackId) {
  const feedback = state.feedbacks.find((item) => item.id === feedbackId);
  if (!feedback || feedback.authorId !== currentMemberId) return;
  state.feedbacks = state.feedbacks.filter((item) => item.id !== feedbackId);
  state.commitments = state.commitments.filter((item) => item.sourceFeedbackId !== feedbackId);
  saveState();
  render();
  showToast("전하려던 이야기를 지웠어요.");
}

function toggleCommitment(feedbackId, selected) {
  const feedback = state.feedbacks.find(
    (item) => item.id === feedbackId && item.recipientId === currentMemberId && ACTIONABLE_CATEGORIES.includes(item.category),
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
      reason: "",
      plan: "",
      support: "",
      weeklyLog: "",
      progress: 0,
      createdAt: now,
      updatedAt: now,
    });
    showToast("이번 3개월의 작은 약속이 정해졌어요.");
  }
  if (!selected && existing) {
    state.commitments = state.commitments.filter((item) => item.id !== existing.id);
    showToast("조금 더 생각해보기로 했어요.");
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
  if (event.target.matches(".commitment-text")) {
    commitment.text = event.target.value;
  }
  if (event.target.matches(".commitment-reason")) {
    commitment.reason = event.target.value;
  }
  if (event.target.matches(".commitment-support")) {
    commitment.support = event.target.value;
  }
  if (event.target.matches(".commitment-weekly-log")) {
    commitment.weeklyLog = event.target.value;
  }
  if (event.target.matches(".commitment-progress")) {
    commitment.progress = clampPercent(Number(event.target.value));
    event.target.style.setProperty("--progress", `${commitment.progress}%`);
    card.querySelector(".commitment-progress-value").textContent = progressLabel(commitment.progress);
    const rangeLabel = card.querySelector(`label[for="progress-${commitment.id}"]`);
    if (rangeLabel) rangeLabel.textContent = `작은 약속 상태 · ${progressLabel(commitment.progress)}`;
    showToast("오늘의 실천 기록이 저장되었어요.");
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
  if (values[1]) values[1].textContent = progressLabel(average);
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
  if (showToastMessage) showToast("현재 마음노트를 보관했어요.");
}

async function startNextCycle() {
  if (!isParent(currentMemberId)) return;
  if (!window.confirm("현재 마음노트를 보관하고 새로운 3개월 가족 마음 나누기를 시작할까요?")) return;
  try {
    await archiveCurrentCycle(false);
    const nextStart = formatDateInput(addMonths(new Date(`${state.cycleStartDate}T00:00:00`), 3));
    state = seedState(nextStart);
    activeRecipientId = state.members.find((member) => member.id !== currentMemberId)?.id || null;
    saveState();
    await pushRemoteState();
    render();
    showToast("새로운 3개월 가족 마음 나누기를 시작했어요.");
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

elements.welcomeStartButton?.addEventListener("click", closeWelcomeModal);

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
    renderRecipientSelfContext();
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
if (currentMemberId) showWelcomeModalOnce();
initRemoteSync();
