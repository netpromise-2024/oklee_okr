const STORAGE_KEY = "family-okr-workflow-v2";
const SUPABASE_URL = "https://laquzdfgwtxkcuxzvesg.supabase.co";
const SUPABASE_KEY = "sb_publishable_afRB9ccJ23fNekWd8m3ibA_uZiYUTmo";
const SUPABASE_TABLE = "family_okr_state";
const SUPABASE_ROW_ID = "oklee-family-okr";
const OBJECTIVE_LIMIT = 2;
const PERSONAL_OBJECTIVE_LIMIT = 3;
const KR_LIMIT = 3;
const INITIATIVE_LIMIT = 3;

const elements = {
  cycleName: document.querySelector("#cycleName"),
  missionText: document.querySelector("#missionText"),
  valuesGrid: document.querySelector("#valuesGrid"),
  confirmedObjectiveCount: document.querySelector("#confirmedObjectiveCount"),
  familyKrCount: document.querySelector("#familyKrCount"),
  personalObjectiveCount: document.querySelector("#personalObjectiveCount"),
  personalPlanCount: document.querySelector("#personalPlanCount"),
  overallAchievementProgress: document.querySelector("#overallAchievementProgress"),
  overallAchievementBar: document.querySelector("#overallAchievementBar"),
  achievementCaption: document.querySelector("#achievementCaption"),
  memberAchievementGrid: document.querySelector("#memberAchievementGrid"),
  overallSetupProgress: document.querySelector("#overallSetupProgress"),
  overallSetupBar: document.querySelector("#overallSetupBar"),
  stepProgressGrid: document.querySelector("#stepProgressGrid"),
  proposalMemberTabs: document.querySelector("#proposalMemberTabs"),
  personalMemberTabs: document.querySelector("#personalMemberTabs"),
  proposalForm: document.querySelector("#proposalForm"),
  proposalTitle: document.querySelector("#proposalTitle"),
  proposalValue: document.querySelector("#proposalValue"),
  proposalNote: document.querySelector("#proposalNote"),
  recommendTitle: document.querySelector("#recommendTitle"),
  loadRecommendations: document.querySelector("#loadRecommendations"),
  recommendList: document.querySelector("#recommendList"),
  voteStatus: document.querySelector("#voteStatus"),
  confirmObjectives: document.querySelector("#confirmObjectives"),
  candidateGrid: document.querySelector("#candidateGrid"),
  familyKrBoard: document.querySelector("#familyKrBoard"),
  krPoolStatus: document.querySelector("#krPoolStatus"),
  krPool: document.querySelector("#krPool"),
  pickedTitle: document.querySelector("#pickedTitle"),
  pickedStatus: document.querySelector("#pickedStatus"),
  pickedList: document.querySelector("#pickedList"),
  personalBuilder: document.querySelector("#personalBuilder"),
  weeklyReviewForm: document.querySelector("#weeklyReviewForm"),
  reviewMember: document.querySelector("#reviewMember"),
  reviewValue: document.querySelector("#reviewValue"),
  reviewBody: document.querySelector("#reviewBody"),
  reviewNextAction: document.querySelector("#reviewNextAction"),
  weeklyReviewList: document.querySelector("#weeklyReviewList"),
  connectionMap: document.querySelector("#connectionMap"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  resetButton: document.querySelector("#resetButton"),
  syncStatus: document.querySelector("#syncStatus"),
  toast: document.querySelector("#toast"),
};

let state = loadState();
let activeProposalMemberId = state.members[0].id;
let activePersonalMemberId = state.members[0].id;
let visibleRecommendationMemberId = null;
let toastTimer;
let remoteUpdatedAt = null;
let remoteSaveTimer;
let remoteSaving = false;
let applyingRemoteState = false;

function uid() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function currentQuarterLabel(date = new Date()) {
  return `${date.getFullYear()}년 ${Math.floor(date.getMonth() / 3) + 1}분기 OK&Lee Family OKR`;
}

function defaultMembers() {
  return [
    { id: "father", role: "아빠", name: "옥호성" },
    { id: "mother", role: "엄마", name: "이건화" },
    { id: "son1", role: "큰아들", name: "옥승현" },
    { id: "son2", role: "둘째아들", name: "옥수현" },
    { id: "son3", role: "셋째아들", name: "옥서현" },
    { id: "daughter1", role: "넷째딸", name: "옥소현" },
  ];
}

function defaultValues() {
  return [
    {
      id: "benevolence",
      han: "仁",
      ko: "인",
      title: "어진 마음",
      description: "실수를 이해하고 보듬어준다.",
    },
    {
      id: "righteousness",
      han: "義",
      ko: "의",
      title: "옳은 용기",
      description: "나쁜 일을 피하지 않고 돕는다.",
    },
    {
      id: "propriety",
      han: "禮",
      ko: "예",
      title: "상대 배려",
      description: "상대의 마음을 생각하고 행동한다.",
    },
    {
      id: "wisdom",
      han: "智",
      ko: "지",
      title: "생각의 성장",
      description: "행동 전에 생각하고 생각하는 힘을 키운다.",
    },
    {
      id: "integrity",
      han: "信",
      ko: "신",
      title: "진실과 감사",
      description: "진실하게 말하고 감사하는 마음을 갖는다.",
    },
  ];
}

function seedState() {
  return {
    cycleName: currentQuarterLabel(),
    mission: "사회에 기여하는 사람이 되자.",
    values: defaultValues(),
    members: defaultMembers(),
    objectiveCandidates: [],
    confirmedObjectiveIds: [],
    personalSelections: {},
    personalPlans: {},
    weeklyReviews: [],
  };
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return seedState();
  }

  try {
    return normalizeState(JSON.parse(saved));
  } catch {
    return seedState();
  }
}

function normalizeState(candidateState) {
  if (!candidateState || !Array.isArray(candidateState.objectiveCandidates)) {
    return seedState();
  }
  return {
    cycleName: candidateState.cycleName || currentQuarterLabel(),
    mission: candidateState.mission || "사회에 기여하는 사람이 되자.",
    values: normalizeValues(candidateState.values),
    members: normalizeMembers(candidateState.members),
    objectiveCandidates: candidateState.objectiveCandidates.map(normalizeCandidate),
    confirmedObjectiveIds: Array.isArray(candidateState.confirmedObjectiveIds) ? candidateState.confirmedObjectiveIds : [],
    personalSelections:
      candidateState.personalSelections && typeof candidateState.personalSelections === "object"
        ? candidateState.personalSelections
        : {},
    personalPlans:
      candidateState.personalPlans && typeof candidateState.personalPlans === "object" ? candidateState.personalPlans : {},
    weeklyReviews: Array.isArray(candidateState.weeklyReviews) ? candidateState.weeklyReviews.map(normalizeWeeklyReview) : [],
  };
}

function normalizeWeeklyReview(review) {
  return {
    id: review.id || uid(),
    createdAt: review.createdAt || new Date().toISOString(),
    memberId: review.memberId || "father",
    valueId: review.valueId || "benevolence",
    body: review.body || "",
    nextAction: review.nextAction || "",
  };
}

function normalizeValues(values) {
  const defaults = defaultValues();
  if (!Array.isArray(values)) {
    return defaults;
  }
  return defaults.map((value) => ({
    ...value,
    ...(values.find((item) => item.id === value.id) || {}),
  }));
}

function normalizeMembers(members) {
  const defaults = defaultMembers();
  if (!Array.isArray(members)) {
    return defaults;
  }
  return defaults.map((member) => ({
    ...member,
    ...(members.find((item) => item.id === member.id) || {}),
  }));
}

function normalizeCandidate(candidate) {
  return {
    id: candidate.id || uid(),
    proposerId: candidate.proposerId || "father",
    title: candidate.title || "",
    valueId: candidate.valueId || "benevolence",
    note: candidate.note || "",
    votes: Array.isArray(candidate.votes) ? candidate.votes : [],
    familyKrs: normalizeFamilyKrs(candidate.familyKrs),
  };
}

function normalizeFamilyKrs(krs) {
  const existing = Array.isArray(krs) ? krs : [];
  return Array.from({ length: KR_LIMIT }, (_, index) => ({
    id: existing[index]?.id || uid(),
    title: existing[index]?.title || "",
    progress: clampPercent(Number(existing[index]?.progress || 0)),
  }));
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (!applyingRemoteState) {
    scheduleRemoteSave();
  }
}

function setSyncStatus(message, tone = "pending") {
  elements.syncStatus.textContent = message;
  elements.syncStatus.dataset.tone = tone;
}

function supabaseEndpoint(query = "") {
  return `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}${query}`;
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    ...extra,
  };
}

function stateHasWork(candidateState) {
  return Boolean(
    candidateState.objectiveCandidates.length ||
      candidateState.confirmedObjectiveIds.length ||
      Object.values(candidateState.personalSelections).some((selections) => Array.isArray(selections) && selections.length) ||
      Object.keys(candidateState.personalPlans).length ||
      candidateState.weeklyReviews.length,
  );
}

async function fetchRemoteState() {
  const response = await fetch(
    supabaseEndpoint(`?id=eq.${encodeURIComponent(SUPABASE_ROW_ID)}&select=id,data,updated_at`),
    {
      headers: supabaseHeaders(),
    },
  );
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const rows = await response.json();
  return rows[0] || null;
}

async function pushRemoteState() {
  remoteSaving = true;
  setSyncStatus("공유 저장 중", "pending");
  try {
    const response = await fetch(supabaseEndpoint("?on_conflict=id"), {
      method: "POST",
      headers: supabaseHeaders({
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      }),
      body: JSON.stringify([{ id: SUPABASE_ROW_ID, data: state }]),
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const rows = await response.json();
    remoteUpdatedAt = rows[0]?.updated_at || new Date().toISOString();
    setSyncStatus("공유됨", "ok");
  } catch (error) {
    console.error(error);
    setSyncStatus("로컬 저장 중", "error");
  } finally {
    remoteSaving = false;
  }
}

function scheduleRemoteSave() {
  setSyncStatus("저장 대기 중", "pending");
  window.clearTimeout(remoteSaveTimer);
  remoteSaveTimer = window.setTimeout(() => {
    remoteSaveTimer = null;
    pushRemoteState();
  }, 650);
}

function applyRemoteState(remoteData, updatedAt) {
  applyingRemoteState = true;
  state = normalizeState(remoteData);
  ensureActiveMembers();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  applyingRemoteState = false;
  remoteUpdatedAt = updatedAt || remoteUpdatedAt;
  render();
  setSyncStatus("공유됨", "ok");
}

function ensureActiveMembers() {
  if (!state.members.some((member) => member.id === activeProposalMemberId)) {
    activeProposalMemberId = state.members[0].id;
  }
  if (!state.members.some((member) => member.id === activePersonalMemberId)) {
    activePersonalMemberId = state.members[0].id;
  }
}

async function pullRemoteState() {
  if (remoteSaveTimer || remoteSaving) return;
  try {
    const remote = await fetchRemoteState();
    if (!remote) {
      await pushRemoteState();
      return;
    }
    const remoteState = normalizeState(remote.data);
    if (!remote.data?.objectiveCandidates && stateHasWork(state)) {
      await pushRemoteState();
      return;
    }
    if (remote.updated_at && remote.updated_at !== remoteUpdatedAt) {
      applyRemoteState(remoteState, remote.updated_at);
    }
  } catch (error) {
    console.error(error);
    setSyncStatus("로컬 저장 중", "error");
  }
}

async function initRemoteSync() {
  setSyncStatus("공유 저장소 연결 중", "pending");
  try {
    const remote = await fetchRemoteState();
    if (remote?.data?.objectiveCandidates) {
      applyRemoteState(remote.data, remote.updated_at);
    } else {
      await pushRemoteState();
    }
    window.addEventListener("focus", pullRemoteState);
    window.setInterval(pullRemoteState, 12000);
  } catch (error) {
    console.error(error);
    setSyncStatus("Supabase 설정 필요", "error");
    showToast("Supabase 테이블 설정 후 다시 열어주세요.");
  }
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function memberById(memberId) {
  return state.members.find((member) => member.id === memberId) || state.members[0];
}

function valueById(valueId) {
  return state.values.find((value) => value.id === valueId) || state.values[0];
}

function memberLabel(member) {
  if (member.role === "큰아들") return "승현";
  if (member.role === "둘째아들") return "수현";
  if (member.role === "셋째아들") return "서현";
  if (member.role === "넷째딸") return "소현";
  return member.role;
}

function familyKrKey(objectiveId, krId) {
  return `${objectiveId}::${krId}`;
}

function parseFamilyKrKey(key) {
  const [objectiveId, krId] = key.split("::");
  return { objectiveId, krId };
}

function confirmedObjectives() {
  return state.confirmedObjectiveIds
    .map((id) => state.objectiveCandidates.find((candidate) => candidate.id === id))
    .filter(Boolean);
}

function familyKrPool() {
  return confirmedObjectives().flatMap((objective) =>
    objective.familyKrs
      .filter((kr) => kr.title.trim())
      .map((kr) => ({
        key: familyKrKey(objective.id, kr.id),
        objective,
        kr,
      })),
  );
}

function candidateRanked() {
  return [...state.objectiveCandidates].sort((a, b) => {
    const diff = b.votes.length - a.votes.length;
    if (diff !== 0) return diff;
    return state.objectiveCandidates.indexOf(a) - state.objectiveCandidates.indexOf(b);
  });
}

function hasTieAtCutoff() {
  const ranked = candidateRanked();
  if (ranked.length <= OBJECTIVE_LIMIT) {
    return false;
  }
  return ranked[OBJECTIVE_LIMIT - 1].votes.length === ranked[OBJECTIVE_LIMIT].votes.length;
}

function personalSelections(memberId) {
  const selections = state.personalSelections[memberId] || [];
  const validKeys = new Set(familyKrPool().map((item) => item.key));
  return selections.filter((key) => validKeys.has(key));
}

function getPersonalPlan(memberId, key) {
  state.personalPlans[memberId] ||= {};
  state.personalPlans[memberId][key] ||= {
    personalKrs: Array.from({ length: KR_LIMIT }, () => ({
      id: uid(),
      title: "",
      initiatives: [],
      progress: 0,
    })),
  };

  const plan = state.personalPlans[memberId][key];
  plan.personalKrs ||= [];
  while (plan.personalKrs.length < KR_LIMIT) {
    plan.personalKrs.push({ id: uid(), title: "", initiatives: [], progress: 0 });
  }
  plan.personalKrs = plan.personalKrs.slice(0, KR_LIMIT).map((kr) => ({
    id: kr.id || uid(),
    title: kr.title || "",
    initiatives: Array.isArray(kr.initiatives) ? kr.initiatives.slice(0, INITIATIVE_LIMIT) : [],
    progress: clampPercent(Number(kr.progress || 0)),
  }));
  return plan;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function filledFamilyKrCount() {
  return confirmedObjectives().reduce(
    (sum, objective) => sum + objective.familyKrs.filter((kr) => kr.title.trim()).length,
    0,
  );
}

function totalPersonalSelections() {
  return state.members.reduce((sum, member) => sum + personalSelections(member.id).length, 0);
}

function filledPersonalKrCount() {
  return state.members.reduce((sum, member) => {
    return (
      sum +
      personalSelections(member.id).reduce((innerSum, key) => {
        const plan = getPersonalPlan(member.id, key);
        return innerSum + plan.personalKrs.filter((kr) => kr.title.trim()).length;
      }, 0)
    );
  }, 0);
}

function filledInitiativeCount() {
  return state.members.reduce((sum, member) => {
    return (
      sum +
      personalSelections(member.id).reduce((innerSum, key) => {
        const plan = getPersonalPlan(member.id, key);
        return innerSum + plan.personalKrs.reduce((count, kr) => count + kr.initiatives.filter(Boolean).length, 0);
      }, 0)
    );
  }, 0);
}

function personalKrActive(kr) {
  return kr.title.trim() || kr.initiatives.length || kr.progress > 0;
}

function averageProgress(items) {
  if (!items.length) return 0;
  return clampPercent(items.reduce((sum, value) => sum + value, 0) / items.length);
}

function personalObjectiveAchievement(memberId, key) {
  const plan = getPersonalPlan(memberId, key);
  const krs = plan.personalKrs.filter(personalKrActive);
  return averageProgress(krs.map((kr) => kr.progress));
}

function memberAchievement(memberId) {
  const selections = personalSelections(memberId);
  if (!selections.length) return 0;
  return averageProgress(selections.map((key) => personalObjectiveAchievement(memberId, key)));
}

function overallAchievementProgress() {
  return averageProgress(state.members.map((member) => memberAchievement(member.id)));
}

function setupProgressItems() {
  const confirmed = confirmedObjectives().length;
  const confirmedTarget = OBJECTIVE_LIMIT;
  const familyKrTarget = confirmedTarget * KR_LIMIT;
  const familyKrs = filledFamilyKrCount();
  const personalTarget = state.members.length * PERSONAL_OBJECTIVE_LIMIT;
  const personalSelected = totalPersonalSelections();
  const selectedTarget = personalSelected * KR_LIMIT;
  const personalKrs = filledPersonalKrCount();
  const reviewTarget = Math.max(state.members.length, 1);
  const reviews = state.weeklyReviews.length;

  return [
    {
      title: "가족 O 확정",
      detail: `${confirmed}/${confirmedTarget}`,
      progress: clampPercent((confirmed / confirmedTarget) * 100),
    },
    {
      title: "가족 KR 작성",
      detail: `${familyKrs}/${familyKrTarget}`,
      progress: clampPercent((familyKrs / familyKrTarget) * 100),
    },
    {
      title: "개인 O 선택",
      detail: `${personalSelected}/${personalTarget}`,
      progress: clampPercent((personalSelected / personalTarget) * 100),
    },
    {
      title: "개인 KR 작성",
      detail: `${personalKrs}/${selectedTarget}`,
      progress: personalSelected ? clampPercent((personalKrs / selectedTarget) * 100) : 0,
    },
    {
      title: "주간 리뷰",
      detail: `${reviews}/${reviewTarget}`,
      progress: clampPercent((Math.min(reviews, reviewTarget) / reviewTarget) * 100),
    },
  ];
}

function overallSetupProgress() {
  const items = setupProgressItems();
  return clampPercent(items.reduce((sum, item) => sum + item.progress, 0) / items.length);
}

function recommendationsFor(memberId) {
  const map = {
    father: [
      ["가족이 사회에 도움이 되는 경험을 만드는 분기", "righteousness", "가훈을 가족 밖의 행동으로 연결한다."],
      ["가족의 돈과 시간을 더 지혜롭게 쓰는 분기", "wisdom", "선택 전에 생각하고 함께 결정하는 힘을 키운다."],
      ["아이들이 실패를 숨기지 않아도 되는 분기", "benevolence", "실수를 보듬는 분위기를 만든다."],
    ],
    mother: [
      ["서로의 마음을 먼저 살피는 분기", "propriety", "말투와 생활 리듬에서 배려를 실천한다."],
      ["감사와 진실이 식탁에서 오가는 분기", "integrity", "작은 감사와 솔직한 말이 쌓이게 한다."],
      ["형제자매가 서로 돌보는 분기", "benevolence", "도움과 화해를 가족 문화로 만든다."],
    ],
    son1: [
      ["공부 루틴을 스스로 책임지는 분기", "wisdom", "몸이 자라는 만큼 생각하는 힘도 키운다."],
      ["동생에게 좋은 본보기가 되는 분기", "propriety", "강요보다 행동으로 보여준다."],
      ["정직하게 말하고 빨리 회복하는 분기", "integrity", "실수보다 회복을 중요하게 본다."],
    ],
    son2: [
      ["꾸준함으로 자신감을 만드는 분기", "wisdom", "작은 루틴을 반복해서 성장한다."],
      ["형제와 다툼을 줄이는 분기", "benevolence", "상대의 실수를 공격하지 않는다."],
      ["옳은 일을 피하지 않는 분기", "righteousness", "도움이 필요한 순간에 용기 있게 움직인다."],
    ],
    son3: [
      ["생각하고 행동하는 힘을 키우는 분기", "wisdom", "바로 반응하기 전에 한 번 생각한다."],
      ["친구와 가족에게 따뜻한 말을 늘리는 분기", "benevolence", "작은 말로 분위기를 바꾼다."],
      ["약속을 지키는 나를 만드는 분기", "integrity", "말한 것을 행동으로 이어간다."],
    ],
    daughter1: [
      ["가족 모두가 소현이와 즐겁게 연결되는 분기", "benevolence", "어린 가족 구성원의 리듬을 함께 돌본다."],
      ["집안에서 서로 기다려주는 분기", "propriety", "작은 배려를 반복한다."],
      ["감사 표현이 많아지는 분기", "integrity", "좋았던 순간을 말로 남긴다."],
    ],
  };

  return (map[memberId] || map.father).map(([title, valueId, note]) => ({
    id: uid(),
    proposerId: memberId,
    title,
    valueId,
    note,
    votes: [],
    familyKrs: normalizeFamilyKrs([]),
  }));
}

function render() {
  elements.cycleName.value = state.cycleName;
  elements.missionText.textContent = state.mission;
  renderValues();
  renderMemberTabs();
  renderProposalForm();
  renderWeeklyReviewForm();
  renderRecommendations();
  renderCandidates();
  renderFamilyKrs();
  renderPersonalPick();
  renderPersonalBuilder();
  renderWeeklyReviews();
  renderConnectionMap();
  renderMetrics();
}

function renderValues() {
  elements.valuesGrid.innerHTML = state.values
    .map(
      (value) => `
        <article class="value-card">
          <strong>${escapeHTML(value.ko)} <span>${escapeHTML(value.han)}</span></strong>
          <p>${escapeHTML(value.title)}</p>
          <small>${escapeHTML(value.description)}</small>
        </article>
      `,
    )
    .join("");
}

function renderMemberTabs() {
  const tabs = (activeId, type) =>
    state.members
      .map(
        (member) => `
          <button type="button" data-member-id="${member.id}" data-tab-type="${type}" aria-selected="${member.id === activeId}">
            ${escapeHTML(memberLabel(member))}
          </button>
        `,
      )
      .join("");

  elements.proposalMemberTabs.innerHTML = tabs(activeProposalMemberId, "proposal");
  elements.personalMemberTabs.innerHTML = tabs(activePersonalMemberId, "personal");
}

function renderProposalForm() {
  elements.proposalValue.innerHTML = state.values
    .map((value) => `<option value="${value.id}">${escapeHTML(value.ko)} · ${escapeHTML(value.title)}</option>`)
    .join("");
}

function renderRecommendations() {
  const member = memberById(activeProposalMemberId);
  elements.recommendTitle.textContent = `${memberLabel(member)} 추천안`;
  if (visibleRecommendationMemberId !== activeProposalMemberId) {
    elements.recommendList.innerHTML = emptyState("추천안이 필요할 때만 열어보세요", "선택한 사람의 관점과 가족 미션·핵심가치를 반영해 3개를 제시합니다.");
    return;
  }

  elements.recommendList.innerHTML = recommendationsFor(activeProposalMemberId)
    .map((candidate) => {
      const value = valueById(candidate.valueId);
      return `
        <article class="recommend-card">
          <span class="pill">${escapeHTML(value.ko)} · ${escapeHTML(value.title)}</span>
          <h4>${escapeHTML(candidate.title)}</h4>
          <p>${escapeHTML(candidate.note)}</p>
          <button class="ghost-action add-recommendation" type="button" data-title="${escapeHTML(candidate.title)}" data-value-id="${candidate.valueId}" data-note="${escapeHTML(candidate.note)}">
            <svg><use href="#icon-plus"></use></svg>
            <span>후보로 올리기</span>
          </button>
        </article>
      `;
    })
    .join("");
}

function renderWeeklyReviewForm() {
  elements.reviewMember.innerHTML = state.members
    .map((member) => `<option value="${member.id}">${escapeHTML(memberLabel(member))}</option>`)
    .join("");
  elements.reviewValue.innerHTML = state.values
    .map((value) => `<option value="${value.id}">${escapeHTML(value.ko)} · ${escapeHTML(value.title)}</option>`)
    .join("");
}

function renderCandidates() {
  const ranked = candidateRanked();
  const tie = hasTieAtCutoff();
  const confirmed = confirmedObjectives();
  elements.voteStatus.textContent = state.objectiveCandidates.length
    ? `후보 ${state.objectiveCandidates.length}개 · 확정 ${confirmed.length}/${OBJECTIVE_LIMIT}${tie ? " · 동점 재투표 필요" : ""}`
    : "후보 0개";

  if (!state.objectiveCandidates.length) {
    elements.candidateGrid.innerHTML = emptyState("아직 후보가 없어요", "각자 후보를 적거나 추천안 3개를 후보로 올려보세요.");
    return;
  }

  elements.candidateGrid.innerHTML = ranked
    .map((candidate, index) => {
      const proposer = memberById(candidate.proposerId);
      const value = valueById(candidate.valueId);
      const selected = state.confirmedObjectiveIds.includes(candidate.id) ? "selected" : "";
      const rank = index < OBJECTIVE_LIMIT ? `TOP ${index + 1}` : "후보";
      return `
        <article class="candidate-card ${selected}" data-candidate-id="${candidate.id}">
          <div class="card-topline">
            <span class="rank-badge">${rank}</span>
            <button class="icon-button delete-candidate" type="button" title="삭제" aria-label="삭제">
              <svg><use href="#icon-trash"></use></svg>
            </button>
          </div>
          <h3>${escapeHTML(candidate.title)}</h3>
          <p>${escapeHTML(candidate.note || "메모 없음")}</p>
          <div class="candidate-meta">
            <span class="pill">${escapeHTML(memberLabel(proposer))}</span>
            <span class="pill">${escapeHTML(value.ko)} · ${escapeHTML(value.title)}</span>
            <span class="pill">${candidate.votes.length}표</span>
          </div>
          <div class="vote-grid">
            ${state.members
              .map(
                (member) => `
                  <button class="vote-button" type="button" data-member-id="${member.id}" aria-pressed="${candidate.votes.includes(member.id)}">
                    ${escapeHTML(memberLabel(member))}
                  </button>
                `,
              )
              .join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderFamilyKrs() {
  const objectives = confirmedObjectives();
  if (!objectives.length) {
    elements.familyKrBoard.innerHTML = emptyState("확정 Objective가 필요해요", "1단계에서 투표로 가족 Objective 2개를 먼저 확정하세요.");
    return;
  }

  elements.familyKrBoard.innerHTML = objectives
    .map(
      (objective) => `
        <article class="family-kr-card" data-objective-id="${objective.id}">
          <div>
            <span class="pill">가족 Objective</span>
            <h3>${escapeHTML(objective.title)}</h3>
          </div>
          <div class="kr-slot-list">
            ${objective.familyKrs
              .map(
                (kr, index) => `
                  <label>
                    KR ${index + 1}
                    <input class="family-kr-input" type="text" maxlength="90" value="${escapeHTML(kr.title)}" data-kr-id="${kr.id}" placeholder="측정 가능한 결과" />
                  </label>
                `,
              )
              .join("")}
          </div>
        </article>
      `,
    )
    .join("");
}

function renderPersonalPick() {
  const member = memberById(activePersonalMemberId);
  const pool = familyKrPool();
  const selections = personalSelections(activePersonalMemberId);
  elements.krPoolStatus.textContent = `${pool.length}개`;
  elements.pickedTitle.textContent = `${memberLabel(member)}의 Objective`;
  elements.pickedStatus.textContent = `${selections.length}/${PERSONAL_OBJECTIVE_LIMIT}`;

  elements.krPool.innerHTML = pool.length
    ? pool
        .map((item) => {
          const selected = selections.includes(item.key);
          return `
            <article class="kr-pool-card ${selected ? "selected" : ""}" data-key="${item.key}">
              <span class="parent-label">${escapeHTML(item.objective.title)}</span>
              <h4>${escapeHTML(item.kr.title)}</h4>
              <button class="${selected ? "secondary-action" : "ghost-action"} toggle-pick" type="button">
                <svg><use href="${selected ? "#icon-check" : "#icon-plus"}"></use></svg>
                <span>${selected ? "가져감" : "가져가기"}</span>
              </button>
            </article>
          `;
        })
        .join("")
    : emptyState("가족 KR이 아직 없어요", "2단계에서 가족 KR을 먼저 작성하세요.");

  elements.pickedList.innerHTML = selections.length
    ? selections
        .map((key) => {
          const item = pool.find((kr) => kr.key === key);
          if (!item) return "";
          return `
            <article class="picked-card">
              <span class="parent-label">${escapeHTML(item.objective.title)}</span>
              <h4>${escapeHTML(item.kr.title)}</h4>
            </article>
          `;
        })
        .join("")
    : emptyState("선택한 Objective가 없어요", "전체 가족 KR 풀에서 3개까지 가져갈 수 있습니다.");
}

function renderPersonalBuilder() {
  const member = memberById(activePersonalMemberId);
  const pool = familyKrPool();
  const selections = personalSelections(activePersonalMemberId);

  if (!selections.length) {
    elements.personalBuilder.innerHTML = emptyState("작성할 개인 Objective가 없어요", "3단계에서 가족 KR을 먼저 가져가세요.");
    return;
  }

  elements.personalBuilder.innerHTML = `
    <div class="builder-heading">${escapeHTML(memberLabel(member))}의 개인 KR · Initiative</div>
    <div class="personal-build-grid">
      ${selections
        .map((key) => {
          const item = pool.find((kr) => kr.key === key);
          if (!item) return "";
          const plan = getPersonalPlan(activePersonalMemberId, key);
          return `
            <article class="personal-build-card" data-key="${key}">
              <span class="parent-label">상위 가족 O · ${escapeHTML(item.objective.title)}</span>
              <h3>${escapeHTML(item.kr.title)}</h3>
              <div class="personal-kr-slots">
                ${plan.personalKrs.map((personalKr, index) => renderPersonalKrSlot(key, personalKr, index)).join("")}
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderPersonalKrSlot(key, personalKr, index) {
  return `
    <div class="personal-kr-slot" data-key="${key}" data-personal-kr-id="${personalKr.id}">
      <label>
        내 KR ${index + 1}
        <input class="personal-kr-input" type="text" maxlength="90" value="${escapeHTML(personalKr.title)}" placeholder="내가 달성할 측정 결과" />
      </label>
      <div class="kr-progress-control">
        <div>
          <span>달성률</span>
          <strong>${personalKr.progress}%</strong>
        </div>
        <input class="range-input personal-kr-progress" type="range" min="0" max="100" step="5" value="${personalKr.progress}" style="--progress: ${personalKr.progress}%" aria-label="내 KR ${index + 1} 달성률" />
      </div>
      <label>
        핵심 Initiative ${INITIATIVE_LIMIT}개 이내
        <textarea class="initiative-input" rows="3" maxlength="220" placeholder="한 줄에 하나씩 입력">${escapeHTML(personalKr.initiatives.join("\n"))}</textarea>
      </label>
    </div>
  `;
}

function renderConnectionMap() {
  const objectives = confirmedObjectives();
  if (!objectives.length) {
    elements.connectionMap.innerHTML = emptyState("연결 전입니다", "가족 Objective가 확정되면 연결 지도가 생깁니다.");
    return;
  }

  elements.connectionMap.innerHTML = objectives
    .map(
      (objective) => `
        <article class="map-objective">
          <h3>${escapeHTML(objective.title)}</h3>
          <div class="map-kr-list">
            ${objective.familyKrs
              .filter((kr) => kr.title.trim())
              .map((kr) => renderMapKr(objective, kr))
              .join("")}
          </div>
        </article>
      `,
    )
    .join("");
}

function renderMapKr(objective, kr) {
  const key = familyKrKey(objective.id, kr.id);
  const takers = state.members.filter((member) => personalSelections(member.id).includes(key));
  return `
    <div class="map-kr">
      <strong>${escapeHTML(kr.title)}</strong>
      <div class="map-people">
        ${
          takers.length
            ? takers.map((member) => renderMapPerson(member, key)).join("")
            : `<span class="muted">아직 가져간 사람이 없음</span>`
        }
      </div>
    </div>
  `;
}

function renderMapPerson(member, key) {
  const plan = getPersonalPlan(member.id, key);
  const personalKrCount = plan.personalKrs.filter((kr) => kr.title.trim()).length;
  const initiativeCount = plan.personalKrs.reduce((sum, kr) => sum + kr.initiatives.filter(Boolean).length, 0);
  const achievement = personalObjectiveAchievement(member.id, key);
  return `
    <span class="person-node">
      ${escapeHTML(memberLabel(member))} · KR ${personalKrCount} · I ${initiativeCount} · ${achievement}%
    </span>
  `;
}

function renderWeeklyReviews() {
  if (!state.weeklyReviews.length) {
    elements.weeklyReviewList.innerHTML = emptyState("아직 주간 리뷰가 없어요", "가족회의가 끝나면 이번 주 배운 점과 다음 행동을 남겨보세요.");
    return;
  }

  elements.weeklyReviewList.innerHTML = [...state.weeklyReviews]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6)
    .map((review) => {
      const member = memberById(review.memberId);
      const value = valueById(review.valueId);
      const date = new Intl.DateTimeFormat("ko-KR", {
        month: "short",
        day: "numeric",
      }).format(new Date(review.createdAt));
      return `
        <article class="review-card">
          <div class="review-card-head">
            <strong>${escapeHTML(memberLabel(member))}</strong>
            <span>${escapeHTML(date)}</span>
          </div>
          <span class="pill">${escapeHTML(value.ko)} · ${escapeHTML(value.title)}</span>
          <p>${escapeHTML(review.body)}</p>
          ${review.nextAction ? `<small>다음 액션 · ${escapeHTML(review.nextAction)}</small>` : ""}
        </article>
      `;
    })
    .join("");
}

function renderProgressOverview() {
  const overall = overallSetupProgress();
  elements.overallSetupProgress.textContent = `${overall}%`;
  elements.overallSetupBar.style.width = `${overall}%`;
  elements.stepProgressGrid.innerHTML = setupProgressItems()
    .map(
      (item) => `
        <article class="step-progress-card">
          <div>
            <strong>${escapeHTML(item.title)}</strong>
            <span>${escapeHTML(item.detail)}</span>
          </div>
          <div class="progress-bar small">
            <span style="width: ${item.progress}%"></span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderAchievementOverview() {
  const overall = overallAchievementProgress();
  const weight = state.members.length ? Math.round(100 / state.members.length) : 0;
  elements.overallAchievementProgress.textContent = `${overall}%`;
  elements.overallAchievementBar.style.width = `${overall}%`;
  elements.achievementCaption.textContent = `개인별 1/n 가중치로 합산 · 현재 1인 ${weight}%`;
  elements.memberAchievementGrid.innerHTML = state.members
    .map((member) => {
      const progress = memberAchievement(member.id);
      return `
        <article class="member-progress-card">
          <div>
            <strong>${escapeHTML(memberLabel(member))}</strong>
            <span>${progress}%</span>
          </div>
          <div class="progress-bar small">
            <span style="width: ${progress}%"></span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderMetrics() {
  const confirmed = confirmedObjectives();
  const pool = familyKrPool();
  const personalObjectiveCount = state.members.reduce((sum, member) => sum + personalSelections(member.id).length, 0);
  const personalPlanCount = filledPersonalKrCount() + filledInitiativeCount();

  elements.confirmedObjectiveCount.textContent = confirmed.length;
  elements.familyKrCount.textContent = pool.length;
  elements.personalObjectiveCount.textContent = personalObjectiveCount;
  elements.personalPlanCount.textContent = personalPlanCount;
  renderAchievementOverview();
  renderProgressOverview();
}

function emptyState(title, text) {
  return `
    <div class="empty-state">
      <div>
        <strong>${escapeHTML(title)}</strong>
        <p>${escapeHTML(text)}</p>
      </div>
    </div>
  `;
}

function addCandidate(candidate) {
  state.objectiveCandidates.push({
    id: candidate.id || uid(),
    proposerId: candidate.proposerId || activeProposalMemberId,
    title: candidate.title.trim(),
    valueId: candidate.valueId,
    note: candidate.note || "",
    votes: candidate.votes || [],
    familyKrs: normalizeFamilyKrs(candidate.familyKrs),
  });
  saveState();
  render();
}

function confirmTopObjectives() {
  if (state.objectiveCandidates.length < OBJECTIVE_LIMIT) {
    showToast("Objective 후보가 2개 이상 필요해요.");
    return;
  }

  if (hasTieAtCutoff()) {
    showToast("2위와 동점인 후보가 있어요. 재투표 후 확정하세요.");
    return;
  }

  state.confirmedObjectiveIds = candidateRanked()
    .slice(0, OBJECTIVE_LIMIT)
    .map((candidate) => candidate.id);
  prunePersonalSelections();
  saveState();
  render();
  showToast("분기 가족 Objective 2개를 확정했어요.");
}

function prunePersonalSelections() {
  const validKeys = new Set(familyKrPool().map((item) => item.key));
  state.members.forEach((member) => {
    state.personalSelections[member.id] = personalSelections(member.id).filter((key) => validKeys.has(key));
  });
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  toastTimer = setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2000);
}

elements.cycleName.addEventListener("input", () => {
  state.cycleName = elements.cycleName.value.trim() || currentQuarterLabel();
  saveState();
});

elements.proposalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = elements.proposalTitle.value.trim();
  if (!title) return;
  addCandidate({
    proposerId: activeProposalMemberId,
    title,
    valueId: elements.proposalValue.value,
    note: elements.proposalNote.value.trim(),
  });
  elements.proposalTitle.value = "";
  elements.proposalNote.value = "";
  showToast("Objective 후보를 올렸어요.");
});

document.addEventListener("click", (event) => {
  const memberTab = event.target.closest("button[data-member-id][data-tab-type]");
  if (memberTab) {
    if (memberTab.dataset.tabType === "proposal") {
      activeProposalMemberId = memberTab.dataset.memberId;
      visibleRecommendationMemberId = null;
    } else {
      activePersonalMemberId = memberTab.dataset.memberId;
    }
    render();
    return;
  }

  const recommendation = event.target.closest(".add-recommendation");
  if (recommendation) {
    addCandidate({
      proposerId: activeProposalMemberId,
      title: recommendation.dataset.title,
      valueId: recommendation.dataset.valueId,
      note: recommendation.dataset.note,
    });
    showToast("추천안을 후보로 올렸어요.");
    return;
  }

  const candidateCard = event.target.closest(".candidate-card");
  if (candidateCard) {
    const candidate = state.objectiveCandidates.find((item) => item.id === candidateCard.dataset.candidateId);
    if (!candidate) return;

    const deleteButton = event.target.closest(".delete-candidate");
    if (deleteButton) {
      state.objectiveCandidates = state.objectiveCandidates.filter((item) => item.id !== candidate.id);
      state.confirmedObjectiveIds = state.confirmedObjectiveIds.filter((id) => id !== candidate.id);
      prunePersonalSelections();
      saveState();
      render();
      showToast("후보를 삭제했어요.");
      return;
    }

    const voteButton = event.target.closest(".vote-button");
    if (voteButton) {
      const memberId = voteButton.dataset.memberId;
      candidate.votes = candidate.votes.includes(memberId)
        ? candidate.votes.filter((id) => id !== memberId)
        : [...candidate.votes, memberId];
      saveState();
      render();
    }
    return;
  }

  const pickButton = event.target.closest(".toggle-pick");
  if (pickButton) {
    const card = pickButton.closest(".kr-pool-card");
    const key = card.dataset.key;
    const selections = personalSelections(activePersonalMemberId);
    if (selections.includes(key)) {
      state.personalSelections[activePersonalMemberId] = selections.filter((item) => item !== key);
    } else {
      if (selections.length >= PERSONAL_OBJECTIVE_LIMIT) {
        showToast("개인 Objective는 3개까지만 가져갈 수 있어요.");
        return;
      }
      state.personalSelections[activePersonalMemberId] = [...selections, key];
      getPersonalPlan(activePersonalMemberId, key);
    }
    saveState();
    render();
  }
});

elements.confirmObjectives.addEventListener("click", confirmTopObjectives);
elements.loadRecommendations.addEventListener("click", () => {
  visibleRecommendationMemberId = activeProposalMemberId;
  renderRecommendations();
  showToast(`${memberLabel(memberById(activeProposalMemberId))} 추천안 3개를 제시했어요.`);
});

elements.weeklyReviewForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const body = elements.reviewBody.value.trim();
  const nextAction = elements.reviewNextAction.value.trim();
  if (!body && !nextAction) {
    showToast("리뷰나 다음 액션 중 하나는 입력해주세요.");
    return;
  }

  state.weeklyReviews.push({
    id: uid(),
    createdAt: new Date().toISOString(),
    memberId: elements.reviewMember.value,
    valueId: elements.reviewValue.value,
    body,
    nextAction,
  });
  elements.reviewBody.value = "";
  elements.reviewNextAction.value = "";
  saveState();
  renderWeeklyReviews();
  renderMetrics();
  showToast("주간 리뷰를 저장했어요.");
});

elements.familyKrBoard.addEventListener("input", (event) => {
  const input = event.target.closest(".family-kr-input");
  if (!input) return;
  const card = input.closest(".family-kr-card");
  const objective = state.objectiveCandidates.find((candidate) => candidate.id === card.dataset.objectiveId);
  const kr = objective?.familyKrs.find((item) => item.id === input.dataset.krId);
  if (!kr) return;
  kr.title = input.value.trim();
  prunePersonalSelections();
  saveState();
  renderPersonalPick();
  renderPersonalBuilder();
  renderConnectionMap();
  renderMetrics();
});

elements.personalBuilder.addEventListener("input", (event) => {
  const slot = event.target.closest(".personal-kr-slot");
  if (!slot) return;
  const plan = getPersonalPlan(activePersonalMemberId, slot.dataset.key);
  const kr = plan.personalKrs.find((item) => item.id === slot.dataset.personalKrId);
  if (!kr) return;

  const titleInput = event.target.closest(".personal-kr-input");
  const initiativeInput = event.target.closest(".initiative-input");
  const progressInput = event.target.closest(".personal-kr-progress");
  if (titleInput) {
    kr.title = titleInput.value.trim();
  }
  if (initiativeInput) {
    const lines = initiativeInput.value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, INITIATIVE_LIMIT);
    kr.initiatives = lines;
    if (initiativeInput.value.split("\n").filter((line) => line.trim()).length > INITIATIVE_LIMIT) {
      initiativeInput.value = lines.join("\n");
      showToast("Initiative는 3개까지만 입력할 수 있어요.");
    }
  }
  if (progressInput) {
    kr.progress = clampPercent(Number(progressInput.value));
    progressInput.style.setProperty("--progress", `${kr.progress}%`);
    const progressValue = slot.querySelector(".kr-progress-control strong");
    if (progressValue) {
      progressValue.textContent = `${kr.progress}%`;
    }
  }
  saveState();
  renderConnectionMap();
  renderMetrics();
});

elements.exportButton.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `${state.cycleName.replace(/[^\w가-힣-]+/g, "-") || "family-okr"}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(anchor.href);
  showToast("파일로 내보냈어요.");
});

elements.importInput.addEventListener("change", () => {
  const file = elements.importInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed.objectiveCandidates)) throw new Error("invalid");
      state = {
        ...seedState(),
        ...parsed,
        values: normalizeValues(parsed.values),
        members: normalizeMembers(parsed.members),
        objectiveCandidates: parsed.objectiveCandidates.map(normalizeCandidate),
        weeklyReviews: Array.isArray(parsed.weeklyReviews) ? parsed.weeklyReviews.map(normalizeWeeklyReview) : [],
      };
      activeProposalMemberId = state.members[0].id;
      activePersonalMemberId = state.members[0].id;
      saveState();
      render();
      showToast("가져오기를 마쳤어요.");
    } catch {
      showToast("가져올 수 없는 파일이에요.");
    } finally {
      elements.importInput.value = "";
    }
  };
  reader.readAsText(file);
});

elements.resetButton.addEventListener("click", () => {
  if (!window.confirm("현재 작성 내용을 모두 초기화할까요?")) return;
  state = seedState();
  activeProposalMemberId = state.members[0].id;
  activePersonalMemberId = state.members[0].id;
  saveState();
  render();
  showToast("초기화했어요.");
});

render();
initRemoteSync();
