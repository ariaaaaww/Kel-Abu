// =====================================================================
// BAGIAN 1: DATA & SETUP (Khusus Match 3: Tim E vs Tim F)
// =====================================================================

const allGameData = [
  // --- MATCH 3 (RONDE 1) ---
  {
    match: 3,
    round: 1,
    question: "Sebutkan hal yang biasanya membuat orang marah di jalan",
    answers: [
      { text: "Macet", score: 26, revealed: false },
      { text: "Lampu Sen yang Salah", score: 12, revealed: false },
      { text: "Diclokain orang", score: 10, revealed: false },
      { text: "Ugal-ugalan", score: 8, revealed: false },
      { text: "Diklakson tanpa sebab", score: 6, revealed: false },
      { text: "Keciprat air", score: 3, revealed: false },
    ],
  },
  // --- MATCH 3 (RONDE 2) ---
  {
    match: 3,
    round: 2,
    question: "Sebutkan benda yang sering dicari ketika listrik padam",
    answers: [
      { text: "Senter", score: 60, revealed: false },
      { text: "Handphone", score: 29, revealed: false },
      { text: "Lilin", score: 17, revealed: false },
      { text: "Kipas Portable", score: 3, revealed: false },
      { text: "Powerbank", score: 2, revealed: false },
      { text: "Orang", score: 2, revealed: false },
    ],
  },
];

let currentQuestionIndex = 0;
const MAX_STRIKES = 3;
const ROUNDS_PER_MATCH = 2;

const teams = {
  // Nama Tim untuk Match 3
  team1: {
    score: 0, // Skor Match Saat Ini
    strikes: 0,
    name: "Tim E",
    scoreElement: "score-team1",
    strikesElement: "strikes-team1",
    disqualified: false,
    isStealing: false,
  },
  team2: {
    score: 0, // Skor Match Saat Ini
    strikes: 0,
    name: "Tim F",
    scoreElement: "score-team2",
    strikesElement: "strikes-team2",
    disqualified: false,
    isStealing: false,
  },
};

// Variabel untuk menampung AKUMULASI POIN TOTAL dari Match sebelumnya (diambil dari localStorage)
const totalGamePoints = {
  team1: 0,
  team2: 0,
  matchId: allGameData[0].match, // ID Match saat ini (3)
};

let activeTeamKey = "team1";
let isRoundOver = false;
let teamsDisqualifiedCount = 0;
let roundScore = 0;
const questionNumberElement = document.getElementById("question-number");
const questionElement = document.getElementById("question");
const answersListElement = document.getElementById("answers-list");
const messageElement = document.getElementById("message");
const nextQuestionButton = document.getElementById("next-question-btn");
const strikeButton = document.getElementById("strike-btn");
const switchTeamButton = document.getElementById("switch-team-btn");
const activeTeamNameElement = document.getElementById("active-team-name");

// =====================================================================
// BAGIAN 2: FUNGSI UTILITY & UI
// =====================================================================

/**
 * Mendapatkan key tim lawan
 */
function getOpponentTeamKey(currentTeamKey) {
  return currentTeamKey === "team1" ? "team2" : "team1";
}

/**
 * 💥 PENTING: Memuat total skor Match sebelumnya dari localStorage.
 */
function loadTotalScores() {
  // Tim 1
  const storedScore1 = localStorage.getItem("family100_total_score1");
  totalGamePoints.team1 = storedScore1 ? parseInt(storedScore1) : 0;

  // Tim 2
  const storedScore2 = localStorage.getItem("family100_total_score2");
  totalGamePoints.team2 = storedScore2 ? parseInt(storedScore2) : 0;
}

/**
 * Membuat elemen span untuk tanda X.
 */
function createStrikeMarks(strikeCount) {
  let html = "";
  for (let i = 0; i < MAX_STRIKES; i++) {
    html += `<span class="strike-mark ${
      i < strikeCount ? "miss" : ""
    }">X</span>`;
  }
  return html;
}

/**
 * Memperbarui tampilan skor dan strike untuk kedua tim.
 */
function updateScoreDisplays() {
  // teams.score adalah SKOR AKUMULASI DALAM SATU MATCH SAAT INI
  document.getElementById(teams.team1.scoreElement).textContent =
    teams.team1.score;
  document.getElementById(teams.team2.scoreElement).textContent =
    teams.team2.score;

  const strikes1 = document.getElementById(teams.team1.strikesElement);
  strikes1.innerHTML = createStrikeMarks(teams.team1.strikes);
  const strikes2 = document.getElementById(teams.team2.strikesElement);
  strikes2.innerHTML = createStrikeMarks(teams.team2.strikes);

  // Highlight tim aktif dan tim yang didiskualifikasi
  document.getElementById("team1-card").style.border = teams.team1.disqualified
    ? "2px dashed #B00020"
    : activeTeamKey === "team1"
    ? "2px solid #03DAC6"
    : "1px solid #555";
  document.getElementById("team2-card").style.border = teams.team2.disqualified
    ? "2px dashed #B00020"
    : activeTeamKey === "team2"
    ? "2px solid #03DAC6"
    : "1px solid #555";

  // Tampilkan Poin Sementara dan Match Info
  const currentMatch = allGameData[currentQuestionIndex]
    ? allGameData[currentQuestionIndex].match
    : "Selesai";
  const currentRoundInMatch = allGameData[currentQuestionIndex]
    ? allGameData[currentQuestionIndex].round
    : "-";

  questionNumberElement.innerHTML = `
        **MATCH ${currentMatch} / 3** (Ronde ${currentRoundInMatch} / ${ROUNDS_PER_MATCH}) <br>
        <span class="round-score">Poin Ronde: ${roundScore}</span>
    `;

  // 💥 PENTING: Tampilkan AKUMULASI POIN TOTAL SELURUH GAME di 'Kemenangan Match'
  // totalGamePoints.teamX + teams.teamX.score (Skor Match saat ini)
  document.getElementById("match-total-team1").textContent =
    totalGamePoints.team1 + teams.team1.score;
  document.getElementById("match-total-team2").textContent =
    totalGamePoints.team2 + teams.team2.score;
}

/**
 * Menampilkan jawaban.
 */
function renderAnswers() {
  answersListElement.innerHTML = "";
  const currentData = allGameData[currentQuestionIndex];
  const activeTeam = teams[activeTeamKey];

  // FASE MANUAL REVEAL
  const isManualRevealPhase =
    isRoundOver && nextQuestionButton.style.display === "block";

  currentData.answers.forEach((answer, index) => {
    const item = document.createElement("div");
    item.classList.add("answer-item");
    item.dataset.index = index;

    const answerText = document.createElement("span");
    const answerScore = document.createElement("span");
    answerScore.classList.add("answer-score");

    if (answer.revealed) {
      item.classList.add("revealed");
      answerText.textContent = `${index + 1}. ${answer.text}`;
      answerScore.textContent = answer.score;
    } else {
      answerText.textContent = `${index + 1}. ***`;
      answerScore.textContent = 0;

      const isClickableInGame = !isRoundOver && !activeTeam.disqualified;

      if (isClickableInGame || isManualRevealPhase) {
        item.classList.add("clickable");
        item.onclick = handleAnswerReveal;
      }
    }

    item.appendChild(answerText);
    item.appendChild(answerScore);
    answersListElement.appendChild(item);
  });
}

// =====================================================================
// BAGIAN 3: FUNGSI LOGIKA PERMAINAN INTI
// =====================================================================

/**
 * Memuat data pertanyaan saat ini.
 */
function loadCurrentQuestion() {
  loadTotalScores(); // Ambil skor total dari Match sebelumnya

  if (currentQuestionIndex >= allGameData.length) {
    endGame(); // Match 3 selesai, langsung ke endGame()
    return;
  }

  const data = allGameData[currentQuestionIndex];
  questionElement.textContent = data.question;

  // Reset status yang HANYA PERLU DIRESET PER RONDE/SOAL:
  teams.team1.strikes = 0;
  teams.team2.strikes = 0;
  teams.team1.disqualified = false;
  teams.team2.disqualified = false;
  teams.team1.isStealing = false;
  teams.team2.isStealing = false;
  teamsDisqualifiedCount = 0;
  isRoundOver = false;
  roundScore = 0; // RESET POIN SEMENTARA UNTUK RONDE INI
  activeTeamKey = "team1";

  // Reset revealed status (penting untuk memulai ronde baru)
  data.answers.forEach((ans) => (ans.revealed = false));

  nextQuestionButton.style.display = "none";
  strikeButton.style.display = "block";
  switchTeamButton.style.display = "block";

  activeTeamNameElement.textContent = teams[activeTeamKey].name;

  updateScoreDisplays();
  renderAnswers();
  messageElement.textContent = `MATCH ${data.match}, RONDE ${data.round} dimulai! ${teams[activeTeamKey].name} adalah tim aktif.`;
}

/**
 * Mengganti tim yang aktif secara manual.
 */
function switchActiveTeam() {
  if (isRoundOver) return;

  const previousTeamKey = activeTeamKey;
  activeTeamKey = getOpponentTeamKey(previousTeamKey);

  // Cek diskualifikasi
  if (teams.team1.disqualified && teams.team2.disqualified) {
    endRoundFailureBothTeams();
    return;
  }

  if (teams[activeTeamKey].disqualified) {
    activeTeamKey = previousTeamKey;
    messageElement.textContent = `Tim ${teams[activeTeamKey].name} didiskualifikasi, tidak bisa beralih. Harus menyelesaikan putaran.`;
    return;
  }

  // Logika Steal
  if (teams[previousTeamKey].disqualified) {
    teams[activeTeamKey].isStealing = true;
    teams[previousTeamKey].isStealing = false;
    messageElement.textContent = `*** STEAL! *** ${teams[activeTeamKey].name} mencoba mencuri ${roundScore} poin. Jawab 1 soal lagi!`;
  } else {
    teams.team1.isStealing = false;
    teams.team2.isStealing = false;
    messageElement.textContent = `Tim aktif beralih ke ${teams[activeTeamKey].name}. Tekan Strike jika salah, atau klik jawaban jika benar.`;
  }

  activeTeamNameElement.textContent = teams[activeTeamKey].name;
  updateScoreDisplays();
  renderAnswers();
}
switchTeamButton.onclick = switchActiveTeam;

/**
 * Menangani klik pada slot jawaban.
 */
function handleAnswerReveal(event) {
  const isPostRoundReveal =
    isRoundOver && nextQuestionButton.style.display === "block";

  if (isRoundOver && !isPostRoundReveal) return;

  const index = parseInt(event.currentTarget.dataset.index);
  const currentData = allGameData[currentQuestionIndex];
  const answer = currentData.answers[index];

  if (!answer.revealed) {
    answer.revealed = true;

    if (!isPostRoundReveal) {
      // Logika Skor Normal / Steal Berhasil
      roundScore += answer.score;

      if (teams[activeTeamKey].isStealing) {
        // STEAL BERHASIL
        teams[activeTeamKey].score += roundScore; // AKUMULASI SKOR RONDE KE SKOR MATCH
        const securedScore = roundScore;
        roundScore = 0;
        teams[activeTeamKey].isStealing = false;
        messageElement.textContent = `*** STEAL BERHASIL! *** ${teams[activeTeamKey].name} mencuri dan mengamankan ${securedScore} poin!`;
      } else {
        // Pengungkapan jawaban normal
        messageElement.textContent = `${teams[activeTeamKey].name} BENAR! Poin Sementara: ${roundScore}. **KLIK 'GANTI TIM AKTIF'** untuk Tim berikutnya.`;
      }

      checkRoundEnd();
    } else {
      // Fase Manual Reveal
      messageElement.textContent = `Jawaban ${
        index + 1
      } terungkap secara manual. Lanjutkan klik atau tekan Lanjut Pertanyaan.`;
    }

    updateScoreDisplays();
    renderAnswers();
  } else {
    messageElement.textContent = `Jawaban ini sudah ditemukan.`;
  }
}

/**
 * Menambahkan strike (salah) pada tim aktif.
 */
function addStrike() {
  if (isRoundOver || teams[activeTeamKey].disqualified) {
    messageElement.textContent =
      "Putaran sudah selesai atau tim ini didiskualifikasi.";
    return;
  }

  const activeTeam = teams[activeTeamKey];

  if (activeTeam.strikes < MAX_STRIKES) {
    activeTeam.strikes++;
    updateScoreDisplays();

    if (activeTeam.strikes >= MAX_STRIKES) {
      const opponentTeamKey = getOpponentTeamKey(activeTeamKey);

      if (activeTeam.isStealing) {
        // KASUS A: STEAL GAGAL
        teams[opponentTeamKey].score += roundScore; // AKUMULASI SKOR RONDE KE SKOR MATCH LAWAN
        const transferredScore = roundScore;
        roundScore = 0;

        messageElement.textContent = `${activeTeam.name} GAGAL mencuri! Poin (${transferredScore}) diberikan kepada ${teams[opponentTeamKey].name}. Putaran Selesai. **KLIK jawaban yang tersisa untuk mengungkapnya.**`;
        endRoundStealFailure(opponentTeamKey);
      } else if (teams[opponentTeamKey].disqualified) {
        // KASUS B: STRIKE 3x SETELAH DISKUALIFIKASI LAWAN (POIN DIAMANKAN)
        teams[activeTeamKey].score += roundScore; // AKUMULASI SISA SKOR RONDE KE SKOR MATCH AKTIF
        const gainedScore = roundScore;
        roundScore = 0;

        messageElement.textContent = `${activeTeam.name} MENCAPAI 3 STRIKE! Poin tambahan (${gainedScore}) diamankan. PUTARAN SELESAI. **KLIK jawaban yang tersisa untuk mengungkapnya.**`;

        endRoundStealFailure(activeTeamKey);
      } else {
        // KASUS C: TIM DIDISKUALIFIKASI NORMAL
        activeTeam.disqualified = true;
        teamsDisqualifiedCount++;
        endRoundDisqualification(activeTeam.name);
      }
    } else {
      // Hanya menambah strike
      messageElement.textContent = `${activeTeam.name} SALAH! Strike ke-${activeTeam.strikes}. **KLIK 'GANTI TIM AKTIF'** untuk Tim berikutnya.`;
    }
  }
}
strikeButton.onclick = addStrike;

/**
 * Mengakhiri putaran karena satu tim didiskualifikasi (mengaktifkan steal untuk lawan).
 */
function endRoundDisqualification(disqualifiedTeamName) {
  messageElement.textContent = `${disqualifiedTeamName} MENCAPAI 3 STRIKE. **KLIK 'GANTI TIM AKTIF'** untuk Tim lawan mengambil alih dan mencoba MENCURI ${roundScore} poin!`;

  renderAnswers();

  if (teamsDisqualifiedCount === 2) {
    endRoundFailureBothTeams();
  }
}

/**
 * Mengakhiri putaran karena gagal mencuri / Strike 3x setelah Steal Berhasil.
 */
function endRoundStealFailure(receivingTeamKey) {
  isRoundOver = true;

  renderAnswers();
  updateScoreDisplays();

  strikeButton.style.display = "none";
  switchTeamButton.style.display = "none";
  nextQuestionButton.style.display = "block";

  renderAnswers();
}

/**
 * Mengakhiri putaran karena kedua tim didiskualifikasi (Poin hangus).
 */
function endRoundFailureBothTeams() {
  isRoundOver = true;
  roundScore = 0; // Poin hangus
  messageElement.textContent = `KEDUA TIM DIDISKUALIFIKASI. Putaran Selesai dan poin hangus. **KLIK jawaban yang tersisa untuk mengungkapnya.**`;

  renderAnswers();

  strikeButton.style.display = "none";
  switchTeamButton.style.display = "none";
  nextQuestionButton.style.display = "block";

  renderAnswers();
}

/**
 * Memeriksa apakah semua jawaban sudah terungkap.
 */
function checkRoundEnd() {
  const currentData = allGameData[currentQuestionIndex];
  const allRevealed = currentData.answers.every((ans) => ans.revealed);

  if (allRevealed) {
    isRoundOver = true;

    // AKUMULASI POIN RONDE TERAKHIR KE SKOR MATCH TIM AKTIF
    if (roundScore > 0) {
      teams[activeTeamKey].score += roundScore;
    }

    roundScore = 0; // Reset Poin Sementara

    messageElement.textContent = `HEBAT! SEMUA jawaban putaran ${currentData.round} ditemukan. PUTARAN SELESAI.`;

    updateScoreDisplays(); // Update skor final ronde (skor Match)

    // Cek apakah Match sudah berakhir (Ronde terakhir dalam Match)
    if (currentData.round === ROUNDS_PER_MATCH) {
      endMatch();
    } else {
      // Akhir ronde (tetapi bukan akhir Match)
      nextQuestionButton.style.display = "block";
      strikeButton.style.display = "none";
      switchTeamButton.style.display = "none";
    }
  }
}

// =====================================================================
// BAGIAN 4: FUNGSI AKUMULASI POIN TOTAL & AKHIR PERMAINAN
// =====================================================================

/**
 * 💥 PENTING: Mengakhiri Match dan menyimpan total skor ke localStorage.
 */
function endMatch() {
  const currentMatchIndexData = allGameData[currentQuestionIndex].match;

  // 1. Hitung total skor dari Match sebelumnya + Match ini
  const finalMatchTotal1 = totalGamePoints.team1 + teams.team1.score;
  const finalMatchTotal2 = totalGamePoints.team2 + teams.team2.score;

  // 2. Simpan skor Match ini ke localStorage
  localStorage.setItem("family100_total_score1", finalMatchTotal1);
  localStorage.setItem("family100_total_score2", finalMatchTotal2);

  // 3. Tentukan pesan akhir Match (Hanya Match ini)
  let winnerMessage;
  if (teams.team1.score > teams.team2.score) {
    winnerMessage = `${teams.team1.name} menang Match ini!`;
  } else if (teams.team2.score > teams.team1.score) {
    winnerMessage = `${teams.team2.name} menang Match ini!`;
  } else {
    winnerMessage = `Match ini SERI!`;
  }

  messageElement.innerHTML = `
        <span style="color: #03DAC6; font-weight: bold;">*** MATCH ${currentMatchIndexData} SELESAI! ***</span><br>
        ${winnerMessage}<br>
        **Skor Akumulasi Total Game Saat Ini:** ${teams.team1.name} (${finalMatchTotal1}) vs ${teams.team2.name} (${finalMatchTotal2})
    `;

  // 4. Reset Skor Match saat ini (teams.score) dan update totalGamePoints
  teams.team1.score = 0;
  teams.team2.score = 0;
  totalGamePoints.team1 = finalMatchTotal1;
  totalGamePoints.team2 = finalMatchTotal2;

  nextQuestionButton.textContent = "LIHAT HASIL AKHIR TOTAL";
  nextQuestionButton.style.display = "block";
  strikeButton.style.display = "none";
  switchTeamButton.style.display = "none";

  updateScoreDisplays();
}

/**
 * Pindah ke pertanyaan berikutnya (atau Match berikutnya).
 */
function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < allGameData.length) {
    loadCurrentQuestion();
  } else {
    // Match selesai, langsung panggil endGame untuk menentukan pemenang total
    endGame();
  }
}

/**
 * 💥 PENTING: Mengakhiri permainan total dan menentukan pemenang berdasarkan akumulasi poin.
 */
function endGame() {
  // Pastikan skor total diambil terakhir kali
  loadTotalScores();
  const finalScore1 = totalGamePoints.team1;
  const finalScore2 = totalGamePoints.team2;
  let winnerMessage;

  if (finalScore1 > finalScore2) {
    winnerMessage = `SELAMAT! Tim 1 MENANG TOTAL dengan total poin ${finalScore1} vs ${finalScore2}.`;
  } else if (finalScore2 > finalScore1) {
    winnerMessage = `SELAMAT! Tim 2 MENANG TOTAL dengan total poin ${finalScore2} vs ${finalScore1}.`;
  } else {
    winnerMessage = `Permainan TOTAL SERI! Total Poin: ${finalScore1} - ${finalScore2}.`;
  }

  messageElement.innerHTML = `
        <span style="font-size: 1.5em; color: #BB86FC; font-weight: bold;">🏆 PERMAINAN SELESAI TOTAL! 🏆</span><br>
        ${winnerMessage}
    `;
  questionElement.textContent = "";
  answersListElement.innerHTML = "";
  nextQuestionButton.style.display = "none";
  strikeButton.style.display = "none";
  switchTeamButton.style.display = "none";

  // 💥 Hapus Skor dari localStorage setelah game selesai total
  localStorage.removeItem("family100_total_score1");
  localStorage.removeItem("family100_total_score2");

  updateScoreDisplays();
}

// =====================================================================
// BAGIAN 5: INISIALISASI
// =====================================================================

document.addEventListener("DOMContentLoaded", () => {
  if (allGameData.length > 0) {
    loadCurrentQuestion();
  }
});
switchTeamButton.onclick = switchActiveTeam;
strikeButton.onclick = addStrike;
nextQuestionButton.onclick = nextQuestion;
