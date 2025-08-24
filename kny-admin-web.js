function runJSCommand() {
  const command = document.getElementById("jsCommand").value.trim();
  const outputElement = document.getElementById("commandOutput");

  if (!command) {
    showToast("Vui lòng nhập lệnh JavaScript", "error");
    outputElement.textContent = "❌ Chưa nhập lệnh nào";
    return;
  }

  try {
    const result = new Function(command)();

    if (result === undefined) {
      outputElement.textContent =
        "✅ Lệnh đã chạy thành công (không có giá trị trả về)";
    } else {
      outputElement.textContent =
        typeof result === "object"
          ? JSON.stringify(result, null, 2)
          : String(result);
    }

    showToast("Lệnh đã chạy thành công");
  } catch (error) {
    outputElement.textContent = `❌ Lỗi: ${error.message}`;
    showToast(`Lỗi: ${error.message}`, "error");
    console.error("Lỗi khi chạy lệnh:", error);
  }
}

function clearJSCommand() {
  document.getElementById("jsCommand").value = "";
  document.getElementById("commandOutput").textContent = "Đã xóa lệnh...";
  showToast("Đã xóa lệnh");
}

function saveJSCommand() {
  const command = document.getElementById("jsCommand").value.trim();

  if (!command) {
    showToast("Không có lệnh để lưu", "error");
    return;
  }

  const commandName = prompt(
    "Đặt tên cho lệnh này:",
    `Lệnh ${savedCommands.length + 1}`
  );

  if (commandName) {
    savedCommands.push({
      name: commandName,
      code: command,
      date: new Date().toISOString(),
    });

    localStorage.setItem("savedCommands", JSON.stringify(savedCommands));
    showToast(`Đã lưu lệnh "${commandName}"`);
  }
}

function loadSavedCommands() {
  const container = document.getElementById("savedCommandsContainer");
  const listElement = document.getElementById("savedCommandsList");

  if (savedCommands.length === 0) {
    container.innerHTML = "<p>Chưa có lệnh nào được lưu</p>";
    listElement.style.display = "block";
    return;
  }

  container.innerHTML = "";

  savedCommands.forEach((cmd, index) => {
    const commandElement = document.createElement("div");
    commandElement.className = "saved-command";

    commandElement.innerHTML = `
        <h4>${cmd.name} <small>(${new Date(cmd.date).toLocaleDateString(
      "vi-VN"
    )})</small></h4>
        <pre>${escapeHTML(cmd.code)}</pre>
        <div class="saved-command-actions">
          <button class="primary" onclick="loadCommand(${index})">
            <i class="fas fa-edit"></i> Tải
          </button>
          <button class="primary" onclick="runSavedCommand(${index})">
            <i class="fas fa-play"></i> Chạy
          </button>
          <button class="primary" onclick="deleteCommand(${index})">
            <i class="fas fa-trash"></i> Xóa
          </button>
        </div>
      `;

    container.appendChild(commandElement);
  });

  listElement.style.display = "block";
}

function loadCommand(index) {
  if (savedCommands[index]) {
    document.getElementById("jsCommand").value = savedCommands[index].code;
    document.getElementById("commandOutput").textContent =
      "Lệnh đã được tải...";
    showToast(`Đã tải lệnh "${savedCommands[index].name}"`);

    document.getElementById("savedCommandsList").style.display = "none";
  }
}

function runSavedCommand(index) {
  if (savedCommands[index]) {
    document.getElementById("jsCommand").value = savedCommands[index].code;
    runJSCommand();
    showToast(`Đang chạy lệnh "${savedCommands[index].name}"`);
  }
}

function deleteCommand(index) {
  if (confirm(`Bạn có chắc muốn xóa lệnh "${savedCommands[index].name}"?`)) {
    savedCommands.splice(index, 1);
    localStorage.setItem("savedCommands", JSON.stringify(savedCommands));
    loadSavedCommands();
    showToast("Đã xóa lệnh");
  }
}

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function loadInteractionTable(membersList = members) {
  const tbody = document.querySelector("#interactionTable tbody");
  tbody.innerHTML = "";

  membersList.forEach((member, index) => {
    if (!interactionData[member.id]) {
      interactionData[member.id] = {
        messageCount: 0,
        interactionPoints: 0,
        confirmed: false,
      };
    }
  });

  const filter = document
    .getElementById("interactionFilter")
    .value.toLowerCase();
  const filteredMembers = membersList.filter((member) =>
    member.nickname.toLowerCase().includes(filter)
  );

  filteredMembers.forEach((member, index) => {
    const data = interactionData[member.id] || {
      messageCount: 0,
      interactionPoints: 0,
      confirmed: false,
    };
    const isLocked = isFinalized && data.confirmed;

    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${member.nickname}</td>
        <td>
          <input 
            type="number" 
            min="0" 
            value="${data.messageCount}" 
            onchange="updateMessageCount('${member.id}', this.value)"
            style="width: 80px; padding: 4px;"
            ${isLocked ? 'class="locked-field" disabled' : ""}
          >
        </td>
        <td>
          <input 
            type="number" 
            min="0" 
            value="${data.interactionPoints}" 
            onchange="updateInteractionPointsManual('${member.id}', this.value)"
            style="width: 70px; padding: 4px;"
            ${isLocked ? 'class="locked-field" disabled' : ""}
          >
        </td>
        <td class="${data.confirmed ? "status-confirmed" : "status-pending"}">
          ${data.confirmed ? "✅ Đã xác nhận" : "⏳ Chờ xác nhận"}
          ${isLocked ? " (🔒 Đã khóa)" : ""}
        </td>
        <td>
          <button class="primary" onclick="confirmInteraction('${member.id}')" 
            ${
              data.confirmed || isFinalized
                ? 'disabled style="opacity: 0.5; cursor: not-allowed;"'
                : ""
            }>
            Xác nhận
          </button>
        </td>
      </tr>
    `;
  });

  updateLastUpdatedTime();
}

function updateMessageCount(memberId, count) {
  if (!interactionData[memberId]) {
    interactionData[memberId] = {
      messageCount: 0,
      interactionPoints: 0,
      confirmed: false,
    };
  }

  interactionData[memberId].messageCount = parseInt(count) || 0;
  updateLastUpdatedTime();
}

function updateInteractionPointsManual(memberId, points) {
  if (!interactionData[memberId]) {
    interactionData[memberId] = {
      messageCount: 0,
      interactionPoints: 0,
      confirmed: false,
    };
  }

  interactionData[memberId].interactionPoints = parseInt(points) || 0;
  updateLastUpdatedTime();
}

function confirmInteraction(memberId) {
  if (!interactionData[memberId] || isFinalized) return;

  interactionData[memberId].confirmed = true;
  showToast("Đã xác nhận tương tác cho thành viên", "success");

  loadInteractionTable();
  updateLastUpdatedTime();
}

function updateInteractionPoints() {
  if (isFinalized) {
    showToast("Dữ liệu đã được chốt, không thể cập nhật", "error");
    return;
  }

  let updatedCount = 0;

  for (const memberId in interactionData) {
    if (
      interactionData[memberId].messageCount >= 100 &&
      !interactionData[memberId].confirmed
    ) {
      interactionData[memberId].confirmed = true;
      interactionData[memberId].interactionPoints = Math.floor(
        interactionData[memberId].messageCount / 100
      );
      updatedCount++;
    }
  }

  showToast(`Đã tự động xác nhận cho ${updatedCount} thành viên`, "success");
  loadInteractionTable();
  updateLastUpdatedTime();
}

function finalizeInteractionPoints() {
  if (isFinalized) {
    showToast("Dữ liệu đã được chốt trước đó", "info");
    return;
  }

  let maxPoints = 0;
  let topMembers = [];
  const memberPoints = [];

  members.forEach((member) => {
    const points = interactionData[member.id]?.interactionPoints || 0;
    memberPoints.push({
      id: member.id,
      nickname: member.nickname,
      points: points,
    });

    if (points > maxPoints) {
      maxPoints = points;
      topMembers = [member.id];
    } else if (points === maxPoints && maxPoints > 0) {
      topMembers.push(member.id);
    }
  });

  displayInteractionChart(memberPoints);

  if (topMembers.length > 0 && maxPoints > 0) {
    topMembers.forEach((memberId) => {
      const memberIndex = members.findIndex((m) => m.id === memberId);
      if (memberIndex !== -1) {
        members[memberIndex].totalPoints =
          (members[memberIndex].totalPoints || 0) + 1;
        showToast(
          `Đã tặng 1 sao cho ${members[memberIndex].nickname} - thành viên tương tác tích cực nhất`,
          "success"
        );
      }
    });

    saveData();
    loadMemberTable();
  }

  isFinalized = true;
  localStorage.setItem("interactionFinalized", "true");

  displayTopMembers(topMembers, maxPoints);
  loadInteractionTable();

  showToast(
    "Đã chốt điểm tương tác. Dữ liệu không thể sửa đổi nữa.",
    "success"
  );
}

function displayInteractionChart(memberPoints) {
  memberPoints.sort((a, b) => b.points - a.points);
  const topMembers = memberPoints.slice(0, 100);
  const maxPoints = topMembers[0]?.points || 1;

  let chartHTML = '<div class="chart-container">';

  topMembers.forEach((member) => {
    const percentage = (member.points / maxPoints) * 100;
    chartHTML += `
      <div class="chart-bar">
        <div class="chart-bar-name">${member.nickname}</div>
        <div class="chart-bar-visual">
          <div class="chart-bar-fill" style="width: ${percentage}%"></div>
        </div>
        <div class="chart-bar-value">${member.points} điểm</div>
      </div>
    `;
  });

  chartHTML += "</div>";
  document.getElementById("interactionChart").innerHTML = chartHTML;
  document.getElementById("interactionChartContainer").style.display = "block";
}

function displayTopMembers(topMembers, points) {
  const container = document.getElementById("topMemberInfo");

  if (topMembers.length === 0 || points === 0) {
    container.innerHTML = "<p>Chưa có thành viên nào đạt điểm tương tác.</p>";
    return;
  }

  let html = "<h4>🏆 Thành viên tương tác tích cực nhất:</h4>";

  topMembers.forEach((memberId) => {
    const member = members.find((m) => m.id === memberId);
    if (member) {
      html += `
        <p>${member.nickname} - ${points} điểm tương tác <span class="top-member-badge">+1 ★</span></p>
      `;
    }
  });

  html +=
    '<p style="margin-top: 10px; color: var(--danger); font-weight: 500;">⚠️ Dữ liệu đã được chốt, chỉ đội ngũ dev mới có thể thay đổi</p>';

  container.innerHTML = html;
}

function filterInteractionMembers() {
  loadInteractionTable();
}

function updateLastUpdatedTime() {
  const lastUpdated = localStorage.getItem("interactionLastUpdated");
  const element = document.getElementById("interactionLastUpdated");

  if (lastUpdated) {
    element.textContent = `Cập nhật lần cuối: ${new Date(
      parseInt(lastUpdated)
    ).toLocaleString("vi-VN")}`;
  } else {
    element.textContent = "Chưa được cập nhật";
  }
}

function saveInteractionData() {
  if (isFinalized) {
    showToast("Dữ liệu đã được chốt, không thể lưu thay đổi", "error");
    return;
  }

  localStorage.setItem("interactionData", JSON.stringify(interactionData));
  localStorage.setItem("interactionLastUpdated", Date.now().toString());
  updateLastUpdatedTime();
  showToast("Đã lưu dữ liệu tương tác", "success");
}

function initInteractionData() {
  members.forEach((member, index) => {
    if (!member.id) {
      member.id = "member_" + Date.now() + "_" + index;
    }
  });

  const savedData = localStorage.getItem("interactionData");
  if (savedData) {
    interactionData = JSON.parse(savedData);
  }

  isFinalized = localStorage.getItem("interactionFinalized") === "true";

  saveData();
}

function loadTaskAssignees() {
  const select = document.getElementById("taskAssignee");
  select.innerHTML = '<option value="">-- Chọn thành viên --</option>';

  // Lấy danh sách thành viên từ localStorage
  const members = JSON.parse(localStorage.getItem("members")) || [];

  // Kiểm tra xem có thành viên nào không
  if (members.length === 0) {
    console.error("Không tìm thấy thành viên nào trong localStorage");
    return;
  }

  console.log("Danh sách thành viên:", members); // Kiểm tra log

  members.forEach((member) => {
    const option = document.createElement("option");
    option.value = member.id || member.nickname; // Sử dụng ID hoặc nickname nếu không có ID
    option.textContent = member.nickname || member.fullName; // Ưu tiên hiển thị nickname, nếu không có thì hiển thị fullName
    select.appendChild(option);
  });
}
function addTask() {
  const assigneeSelect = document.getElementById("taskAssignee");
  const selectedValue = assigneeSelect.value;
  const selectedText =
    assigneeSelect.options[assigneeSelect.selectedIndex].text;

  if (!selectedValue) {
    return showToast("Vui lòng chọn thành viên", "error");
  }

  // Tìm thành viên tương ứng trong danh sách
  const members = JSON.parse(localStorage.getItem("members")) || [];
  const selectedMember = members.find(
    (m) =>
      m.id === selectedValue ||
      m.nickname === selectedValue ||
      m.fullName === selectedValue
  );

  const task = {
    id: Date.now(),
    name: document.getElementById("taskName").value.trim(),
    description: document.getElementById("taskDescription").value.trim(),
    assignee: {
      id: selectedMember?.id || selectedValue,
      nickname: selectedMember?.nickname || selectedText,
      fullName: selectedMember?.fullName || selectedText,
      role: selectedMember?.role,
    },
    deadline: document.getElementById("taskDeadline").value,
    priority: document.getElementById("taskPriority").value,
    status: "Chưa bắt đầu",
    createdAt: new Date().toISOString(),
  };

  if (!task.name || !task.deadline) {
    return showToast("Vui lòng điền đầy đủ thông tin", "error");
  }

  tasks.push(task);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  loadTaskTable();
  resetTaskForm();
  showToast("Đã thêm nhiệm vụ mới");
}

function loadTaskTable(filteredTasks = tasks) {
  const tbody = document.querySelector("#taskTable tbody");
  tbody.innerHTML = "";

  filteredTasks.forEach((task, index) => {
    const deadline = new Date(task.deadline);
    const now = new Date();
    const status =
      task.status === "Chưa bắt đầu" && deadline < now
        ? "Quá hạn"
        : task.status;

    // Hiển thị nickname thay vì tên + role
    const assigneeDisplay =
      task.assignee.nickname ||
      (typeof task.assignee === "string" ? task.assignee : task.assignee.name);

    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${task.name}</td>
        <td>${assigneeDisplay}</td>
        <td>${formatDate(task.deadline)}</td>
        <td><span class="priority-${task.priority.toLowerCase()}">${
      task.priority
    }</span></td>
        <td><span class="status-${status.toLowerCase()}">${status}</span></td>
        <td class="actions">
          <button class="delete-btn" onclick="confirmDeleteTask(${
            task.id
          })">Xóa</button>
          <select onchange="updateTaskStatus(${
            task.id
          }, this.value)" style="padding: 0.25rem;">
            <option value="Chưa bắt đầu" ${
              status === "Chưa bắt đầu" ? "selected" : ""
            }>Chưa bắt đầu</option>
            <option value="Đang thực hiện" ${
              status === "Đang thực hiện" ? "selected" : ""
            }>Đang thực hiện</option>
            <option value="Đã hoàn thành" ${
              status === "Đã hoàn thành" ? "selected" : ""
            }>Đã hoàn thành</option>
          </select>
        </td>
      </tr>
    `;
  });
}

// Thêm hàm formatDate nếu chưa có
function formatDate(dateString) {
  if (!dateString) return "";
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  return new Date(dateString).toLocaleDateString("vi-VN", options);
}

// Thêm hàm reset form
function resetTaskForm() {
  document.getElementById("taskName").value = "";
  document.getElementById("taskDescription").value = "";
  document.getElementById("taskDeadline").value = "";
  document.getElementById("taskPriority").value = "Trung bình";
  document.getElementById("taskAssignee").value = "";
}

// Thêm hàm mở chỉnh sửa task
function openEditTask(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  // Điền thông tin vào form chỉnh sửa (cần thêm form modal hoặc section chỉnh sửa)
  // ...
}

// Thêm hàm xác nhận xóa task
function confirmDeleteTask(taskId) {
  tasks = tasks.filter((t) => t.id !== taskId);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  loadTaskTable();
  showToast("Đã xóa nhiệm vụ", "success");
}

// Cập nhật hàm init
function init() {
  // ... các code hiện có ...
  loadTaskAssignees();
  loadTaskTable();
}

// Quản lý vi phạm
function filterViolationMembers() {
  const filter = document.getElementById("violationFilter").value.toLowerCase();
  const filtered = members.filter(
    (m) =>
      (m.nickname && m.nickname.toLowerCase().includes(filter)) ||
      (m.fullName && m.fullName.toLowerCase().includes(filter)) ||
      (m.rankBadge && m.rankBadge.toLowerCase().includes(filter))
  );
  loadViolationTable(filtered);
}

function loadViolationTable(membersList = members) {
  let tbody = document.querySelector("#violationTable tbody");
  tbody.innerHTML = "";

  membersList.forEach((m, i) => {
    // Chỉ hiển thị thành viên có vi phạm hoặc đang bị khóa
    if (
      (!m.violationHistory || m.violationHistory.length === 0) &&
      !m.status.includes("Bị khóa")
    )
      return;

    const isBanned = m.violationPoints >= VIOLATION_CONFIG.BAN_LIMIT;

    tbody.innerHTML += `
            <tr>
              <td>${i + 1}</td>
              <td>${m.fullName} (${m.nickname})</td>
              <td>${m.violationPoints || 0}</td>
              <td>${m.violationHistory?.length || 0}</td>
              <td>${isBanned ? "🔴 Bị khóa" : "🟢 Hoạt động"}</td>
              <td class="actions">
                <button class="edit-btn" onclick="openViolationModal(${members.indexOf(
                  m
                )})">Chi tiết</button>
                <button class="delete-btn" onclick="confirmClearViolations(${members.indexOf(
                  m
                )})">Xóa lịch sử</button>
                ${
                  isBanned
                    ? `<button class="primary" onclick="unbanMember(${members.indexOf(
                        m
                      )})">Bỏ khóa</button>`
                    : ""
                }
              </td>
            </tr>
          `;
  });
}

function showAllViolations() {
  loadViolationTable(
    members.filter(
      (m) =>
        (m.violationHistory && m.violationHistory.length > 0) ||
        m.status.includes("Bị khóa")
    )
  );
}

function showBannedMembers() {
  loadViolationTable(
    members.filter((m) => m.violationPoints >= VIOLATION_CONFIG.BAN_LIMIT)
  );
}

function confirmClearViolations(memberIndex) {
  if (
    confirm("Bạn có chắc muốn xóa toàn bộ lịch sử vi phạm của thành viên này?")
  ) {
    members[memberIndex].violationPoints = 0;
    members[memberIndex].violationHistory = [];
    if (members[memberIndex].status.includes("Bị khóa")) {
      members[memberIndex].status = "Hoạt động";
    }
    saveData();
    loadViolationTable();
    loadMemberTable();
    showToast("Đã xóa lịch sử vi phạm", "success");
  }
}

function unbanMember(memberIndex) {
  if (
    confirm(`Bạn có chắc muốn bỏ khóa cho ${members[memberIndex].fullName}?`)
  ) {
    members[memberIndex].violationPoints = 0;
    members[memberIndex].status = "Hoạt động";
    saveData();
    loadViolationTable();
    loadMemberTable();
    showToast("Đã bỏ khóa thành viên", "success");
  }
}

function exportViolationData() {
  // Lọc thành viên có vi phạm hoặc bị khóa
  const filteredMembers = members.filter(
    (m) =>
      (m.violationHistory && m.violationHistory.length > 0) ||
      m.status.includes("Bị khóa")
  );

  // Tạo CSV
  let csv =
    "STT,Tên thành viên,Biệt danh,Chức vụ,Điểm vi phạm,Số lần vi phạm,Trạng thái\n";

  filteredMembers.forEach((m, i) => {
    const isBanned = m.violationPoints >= VIOLATION_CONFIG.BAN_LIMIT;
    csv += `${i + 1},"${m.fullName}","${m.nickname}","${m.role}",${
      m.violationPoints || 0
    },${m.violationHistory?.length || 0},"${
      isBanned ? "Bị khóa" : "Hoạt động"
    }"\n`;
  });

  // Tạo file download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `danh_sach_vi_pham_${new Date().toISOString().slice(0, 10)}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("Đã xuất dữ liệu thành công", "success");
}

// Cập nhật hàm init
function init() {
  // ... các code hiện có ...

  // Load bảng vi phạm
  loadViolationTable();
}

// Cấu hình hệ thống
const VIOLATION_CONFIG = {
  WARN_LIMIT: 10,
  BAN_LIMIT: 20,
  POINT_VALUES: {
    Spam: 1,
    "Nội dung không phù hợp": 1,
    "Xúc phạm thành viên": 1,
    "Tha thứ cho lỗi vi phạm": -1,
    "Lỗi vi phạm khác": 1,
    "Vi phạm quyền (trầm trọng)": 1,
  },
};

// Biến toàn cục
let savedCommands = JSON.parse(localStorage.getItem("savedCommands")) || [];
let files = JSON.parse(localStorage.getItem("files")) || [];
let selectedFiles = [];
let currentFilePage = 1;
const filesPerPage = 10;
let currentAvatarMemberIndex = null;
let members = JSON.parse(localStorage.getItem("members")) || [];
let roles = JSON.parse(localStorage.getItem("roles")) || [];
let groupInfo = JSON.parse(localStorage.getItem("groupInfo")) || {};
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let interactionData = JSON.parse(localStorage.getItem("interactionData")) || {};
let events = JSON.parse(localStorage.getItem("events")) || [];
let memberRanks = JSON.parse(localStorage.getItem("memberRanks")) || {};
let isFinalized = localStorage.getItem("interactionFinalized") === "true";
let editMemberIndex = null;
let deleteMemberIndex = null;
let editRoleIndex = null;
let deleteRoleIndex = null;
let currentViolationMember = null;

// Phân trang
const itemsPerPage = 100;
let currentMemberPage = 1;
let currentRolePage = 1;

// Hàm lưu dữ liệu
function saveData() {
  localStorage.setItem("members", JSON.stringify(members));
  localStorage.setItem("roles", JSON.stringify(roles));
  localStorage.setItem("groupInfo", JSON.stringify(groupInfo));
}

// Hàm đánh giá thành viên
function rateMember(rating, memberIndex) {
  if (memberIndex >= 0 && memberIndex < members.length) {
    const today = new Date().toDateString();
    const member = members[memberIndex];

    // Kiểm tra ngày mới
    if (member.lastActiveDate !== today) {
      member.lastActiveDate = today;
      member.dailyRating = 0;
      member.totalPoints =
        (member.totalPoints || 0) + (member.dailyRating || 0);
    }

    member.dailyRating = rating;
    saveData();
    loadMemberTable();

    if (rating === 5) {
      showToast(`Đã đánh giá 5 sao cho ${member.nickname}`, "success");
    }
  }
}

// Hàm reset đánh giá hàng ngày
function resetDailyRatings() {
  const today = new Date().toDateString();
  let changed = false;

  members = members.map((member) => {
    if (member.lastActiveDate !== today) {
      changed = true;
      return {
        ...member,
        totalPoints: (member.totalPoints || 0) + (member.dailyRating || 0),
        dailyRating: 0,
        lastActiveDate: today,
      };
    }
    return member;
  });

  if (changed) {
    saveData();
    loadMemberTable();
    showToast("Đã reset đánh giá cho ngày mới", "info");
  }
}

// Hàm quản lý vi phạm
function addViolation(memberIndex, type, description) {
  const points = VIOLATION_CONFIG.POINT_VALUES[type] || 1;
  const member = members[memberIndex];

  // Khởi tạo các thuộc tính nếu chưa có
  if (!member.violationPoints) member.violationPoints = 0;
  if (!member.violationHistory) member.violationHistory = [];

  member.violationPoints += points;
  member.violationHistory.push({
    date: new Date().toISOString(),
    type,
    description,
    points,
  });

  // Xử lý cảnh báo và ban
  if (member.violationPoints >= VIOLATION_CONFIG.BAN_LIMIT) {
    member.status = `Bị khóa (${member.violationPoints} điểm vi phạm)`;
    showToast(
      `${member.fullName} đã bị khóa do tích lũy nhiều điểm vi phạm`,
      "error"
    );
  } else if (member.violationPoints >= VIOLATION_CONFIG.WARN_LIMIT) {
    showToast(
      `${member.fullName} đã đạt ${member.violationPoints} điểm vi phạm`,
      "warning"
    );
  }

  saveData();
  loadMemberTable();
}

function openViolationModal(memberIndex) {
  currentViolationMember = memberIndex;
  const member = members[memberIndex];

  let modalContent = `
        <div class="modal-header">Quản lý vi phạm: ${member.nickname}</div>
                      <div class="violation-points-display ${
                        member.violationPoints >= VIOLATION_CONFIG.BAN_LIMIT
                          ? "banned"
                          : ""
                      }">
                        Tổng điểm vi phạm: <strong>${
                          member.violationPoints || 0
                        }</strong>
                      </div>

                      <label>Loại vi phạm:</label>
                      <select id="violationType" class="form-control">
                        ${Object.entries(VIOLATION_CONFIG.POINT_VALUES)
                          .map(
                            ([type, points]) => `
                          <option value="${type}">${type} (+${points} điểm)</option>
                        `
                          )
                          .join("")}
                      </select>

                      <label>Mô tả:</label>
                      <textarea id="violationDesc" rows="3" class="form-control"></textarea>

                      <div class="violation-history">
                        <h5>Lịch sử vi phạm</h5>
                        ${
                          member.violationHistory &&
                          member.violationHistory.length > 0
                            ? member.violationHistory
                                .map(
                                  (v) => `
                            <div class="violation-record">
                              <div class="date">${new Date(
                                v.date
                              ).toLocaleString()}</div>
                              <div class="type"><strong>${v.type}</strong> (+${
                                    v.points
                                  }đ)</div>
                              <div class="description">${v.description}</div>
                            </div>
                          `
                                )
                                .join("")
                            : "<p>Không có lịch sử vi phạm</p>"
                        }
                      </div>

                      <div class="modal-actions">
                        <button onclick="closeModal('violationModal')">Đóng</button>
                        <button class="primary" onclick="submitViolation()">Lưu vi phạm</button>
                      </div>
                    `;

  document.getElementById("violationModalContent").innerHTML = modalContent;
  openModal("violationModal");
}

function submitViolation() {
  const type = document.getElementById("violationType").value;
  const description = document.getElementById("violationDesc").value.trim();

  if (!description) {
    showToast("Vui lòng nhập mô tả vi phạm", "error");
    return;
  }

  addViolation(currentViolationMember, type, description);
  closeModal("violationModal");
}

// Tự động reset đánh giá hàng ngày
function checkDailyReset() {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    resetDailyRatings();
  }
}

// Kiểm tra mỗi phút
setInterval(checkDailyReset, 60000);
// Kiểm tra ngay khi load
checkDailyReset();

function copySyntax() {
  const syntaxText = document.getElementById("syntax-text");
  syntaxText.select();
  syntaxText.setSelectionRange(0, 99999); // cho mobile
  document.execCommand("copy");
  showToast("Đã sao chép cú pháp", "success");
}

function logoutAdmin() {
  // Xóa thông tin đăng nhập khỏi localStorage
  localStorage.removeItem("isAdminLoggedIn");
  localStorage.removeItem("adminUsername");
  localStorage.removeItem("adminPassword");

  // Chuyển về trang login
  window.location.href = "admin-login.html";
}

// Kiểm tra nếu chưa đăng nhập admin thì chặn
if (localStorage.getItem("isAdminLoggedIn") !== "true") {
  window.location.href = "admin-login.html";
}

// Hiển thị section
function showSection(id) {
  // Ẩn tất cả section
  document
    .querySelectorAll(".section")
    .forEach((s) => (s.style.display = "none"));
  // Hiển thị section được chọn
  document.getElementById(id).style.display = "block";

  // Tải dữ liệu theo section
  switch (id) {
    case "members":
      loadMemberTable();
      updateMemberPagination();
      break;
    case "roles":
      loadRoleTable();
      updateRolePagination();
      break;
    case "groupInfo":
      loadGroupInfo();
      break;
    case "tasks":
      loadTaskAssignees();
      loadTaskTable();
      break;
    case "ranks":
      loadRankTable();
      updateRankStats();
      break;
    case "events":
      loadEventsList();
      loadMembersChecklist();
      setupBannerUpload();
      break;
    case "files":
      loadFilesTable();
      setupFileUpload();
      loadFileAccessChecklist();
      break;
    case "commandRunner":
      // Ẩn danh sách lệnh đã lưu khi chuyển section
      document.getElementById("savedCommandsList").style.display = "none";
      break;
  }
}

// Hiển thị/ẩn lý do
function toggleReason() {
  document.getElementById("reasonBox").style.display =
    document.getElementById("statusSelect").value === "Không hoạt động"
      ? "block"
      : "none";
}

function toggleEditReason() {
  document.getElementById("editReasonBox").style.display =
    document.getElementById("editStatusSelect").value === "Không hoạt động"
      ? "block"
      : "none";
}

// Hiển thị/ẩn giới hạn role
function toggleRoleLimit() {
  const roleType = document.getElementById("roleType").value;
  document.getElementById("roleLimitContainer").style.display =
    roleType === "limited" ? "block" : "none";
}

function toggleEditRoleLimit() {
  const roleType = document.getElementById("editRoleType").value;
  document.getElementById("editRoleLimitContainer").style.display =
    roleType === "limited" ? "block" : "none";
}

function showToast(msg, type = "success") {
  let t = document.getElementById("toast");
  if (!t) return;

  t.innerText = msg;
  t.className = "toast " + type + "-toast";
  t.style.display = "block";
  setTimeout(() => (t.style.display = "none"), 3000);
}

// Modal
function openModal(id) {
  document.getElementById(id).style.display = "flex";
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

// Phân trang thành viên
function updateMemberPagination() {
  const totalPages = Math.ceil(members.length / itemsPerPage);
  document.getElementById("memberPrevBtn").disabled = currentMemberPage <= 1;
  document.getElementById("memberNextBtn").disabled =
    currentMemberPage >= totalPages || totalPages === 0;
  document.getElementById(
    "memberPageInfo"
  ).textContent = `Trang ${currentMemberPage}/${
    totalPages > 0 ? totalPages : 1
  }`;
}

function prevMemberPage() {
  if (currentMemberPage > 1) {
    currentMemberPage--;
    loadMemberTable();
    updateMemberPagination();
  }
}

function nextMemberPage() {
  const totalPages = Math.ceil(members.length / itemsPerPage);
  if (currentMemberPage < totalPages) {
    currentMemberPage++;
    loadMemberTable();
    updateMemberPagination();
  }
}

// Phân trang chức vụ
function updateRolePagination() {
  const totalPages = Math.ceil(roles.length / itemsPerPage);
  document.getElementById("rolePrevBtn").disabled = currentRolePage <= 1;
  document.getElementById("roleNextBtn").disabled =
    currentRolePage >= totalPages || totalPages === 0;
  document.getElementById(
    "rolePageInfo"
  ).textContent = `Trang ${currentRolePage}/${totalPages > 0 ? totalPages : 1}`;
}

function prevRolePage() {
  if (currentRolePage > 1) {
    currentRolePage--;
    loadRoleTable();
    updateRolePagination();
  }
}

function nextRolePage() {
  const totalPages = Math.ceil(roles.length / itemsPerPage);
  if (currentRolePage < totalPages) {
    currentRolePage++;
    loadRoleTable();
    updateRolePagination();
  }
}

// Quản lý thông tin nhóm
function loadGroupInfo() {
  // Cập nhật thống kê
  document.getElementById("totalRolesCount").textContent = roles.length;
  document.getElementById("totalMembersCount").textContent = members.length;

  // Tải luật lệ nhóm
  document.getElementById("groupRules").value = groupInfo.rules || "";

  // Tải danh sách admin
  document.getElementById("adminList").value = groupInfo.admins
    ? groupInfo.admins.join(", ")
    : "";

  // Tải danh sách nhân vật
  const container = document.getElementById("characterTagsContainer");
  container.innerHTML = "";

  if (groupInfo.characters && groupInfo.characters.length > 0) {
    groupInfo.characters.forEach((char, index) => {
      const tag = document.createElement("div");
      tag.className = "character-tag";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = char.selected || false;
      checkbox.onchange = () => toggleCharacterSelection(index);

      const label = document.createElement("span");
      label.textContent = char.name;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-character";
      deleteBtn.innerHTML = "&times;";
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteCharacter(index);
      };

      tag.appendChild(checkbox);
      tag.appendChild(label);
      tag.appendChild(deleteBtn);
      container.appendChild(tag);
    });
  }
}

function saveGroupRules() {
  const rules = document.getElementById("groupRules").value.trim();
  groupInfo.rules = rules;
  saveData();
  showToast("Đã lưu luật lệ nhóm");
}

function saveAdminList() {
  const adminInput = document.getElementById("adminList").value.trim();
  const admins = adminInput
    .split(",")
    .map((a) => a.trim())
    .filter((a) => a !== "");
  groupInfo.admins = admins;
  saveData();
  showToast("Đã lưu danh sách Admin");
}

function processCharacters() {
  const input = document.getElementById("characterInput").value.trim();
  if (!input) {
    showToast("Vui lòng nhập danh sách nhân vật", "error");
    return;
  }

  const characters = input
    .split("//")
    .map((c) => c.trim())
    .filter((c) => c !== "");

  if (characters.length === 0) {
    showToast("Không có nhân vật hợp lệ nào được nhập", "error");
    return;
  }

  if (!groupInfo.characters) {
    groupInfo.characters = [];
  }

  // Thêm nhân vật mới (không trùng lặp)
  characters.forEach((name) => {
    if (!groupInfo.characters.some((c) => c.name === name)) {
      groupInfo.characters.push({ name, selected: false });
    }
  });

  saveData();
  loadGroupInfo();
  document.getElementById("characterInput").value = "";
  showToast("Đã thêm nhân vật mới");
}

function toggleCharacterSelection(index) {
  if (!groupInfo.characters || index >= groupInfo.characters.length) return;

  groupInfo.characters[index].selected = !groupInfo.characters[index].selected;
  saveData();
}

function deleteCharacter(index) {
  {
    groupInfo.characters.splice(index, 1);
    saveData();
    loadGroupInfo();
    showToast("Đã xóa nhân vật");
  }
}

// Quản lý chức vụ
function addRole() {
  const name = document.getElementById("roleName").value.trim();
  const roleType = document.getElementById("roleType").value;
  const total =
    roleType === "limited"
      ? parseInt(document.getElementById("roleTotal").value)
      : Infinity;

  if (!name) {
    return showToast("Vui lòng nhập tên chức vụ", "error");
  }

  if (roleType === "limited" && (isNaN(total) || total <= 0)) {
    return showToast("Số lượng role phải lớn hơn 0", "error");
  }

  if (roles.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
    return showToast("Chức vụ đã tồn tại", "error");
  }

  roles.push({ name, total, type: roleType });
  saveData();
  loadRoleTable();
  loadRoleSelects();
  document.getElementById("roleName").value = "";
  document.getElementById("roleTotal").value = "";
  showToast("Đã thêm chức vụ mới");
  updateRolePagination();

  // Cập nhật thống kê
  if (document.getElementById("groupInfo").style.display !== "none") {
    document.getElementById("totalRolesCount").textContent = roles.length;
  }
}

function loadRoleTable() {
  let tbody = document.querySelector("#roleTable tbody");
  tbody.innerHTML = "";

  const startIndex = (currentRolePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, roles.length);

  for (let i = startIndex; i < endIndex; i++) {
    const r = roles[i];
    let used = members.filter((m) => m.role === r.name).length;
    const totalDisplay = r.type === "unlimited" ? "Vô hạn" : r.total;

    tbody.innerHTML += `
                        <tr>
                          <td>${i + 1}</td>
                          <td>${r.name}</td>
                          <td>${used}/${totalDisplay}</td>
                          <td class="actions">
                            <button class="edit-btn" onclick="openEditRole(${i})">Sửa</button>
                            <button class="delete-btn" onclick="openDeleteRole(${i})">Xoá</button>
                          </td>
                        </tr>
                      `;
  }
}

function loadRoleSelects() {
  let sel = document.getElementById("roleSelect");
  let editSel = document.getElementById("editRoleSelect");
  sel.innerHTML = "";
  editSel.innerHTML = "";

  roles.forEach((r) => {
    let used = members.filter((m) => m.role === r.name).length;
    const totalDisplay = r.type === "unlimited" ? "Vô hạn" : r.total;
    let option = `<option value="${r.name}">${r.name} (${used}/${totalDisplay})</option>`;
    sel.innerHTML += option;
    editSel.innerHTML += option;
  });
}

function openEditRole(index) {
  editRoleIndex = index;
  const role = roles[index];
  document.getElementById("editRoleName").value = role.name;
  document.getElementById("editRoleType").value = role.type;

  if (role.type === "limited") {
    document.getElementById("editRoleTotal").value = role.total;
    document.getElementById("editRoleLimitContainer").style.display = "block";
  } else {
    document.getElementById("editRoleLimitContainer").style.display = "none";
  }

  openModal("editRoleModal");
}

function saveEditRole() {
  const name = document.getElementById("editRoleName").value.trim();
  const roleType = document.getElementById("editRoleType").value;
  const total =
    roleType === "limited"
      ? parseInt(document.getElementById("editRoleTotal").value)
      : Infinity;

  if (!name) {
    return showToast("Vui lòng nhập tên chức vụ", "error");
  }

  if (roleType === "limited" && (isNaN(total) || total <= 0)) {
    return showToast("Số lượng role phải lớn hơn 0", "error");
  }

  if (
    roles.some(
      (r, i) =>
        i !== editRoleIndex && r.name.toLowerCase() === name.toLowerCase()
    )
  ) {
    return showToast("Chức vụ đã tồn tại", "error");
  }

  if (roleType === "limited") {
    const used = members.filter(
      (m) => m.role === roles[editRoleIndex].name
    ).length;
    if (total < used) {
      return showToast(
        `Số lượng mới không được nhỏ hơn ${used} (số đang sử dụng)`,
        "error"
      );
    }
  }

  if (roles[editRoleIndex].name !== name) {
    members.forEach((m) => {
      if (m.role === roles[editRoleIndex].name) {
        m.role = name;
      }
    });
  }

  roles[editRoleIndex] = { name, total, type: roleType };
  saveData();
  loadRoleTable();
  loadMemberTable();
  loadRoleSelects();
  closeModal("editRoleModal");
  showToast("Đã cập nhật chức vụ");

  // Cập nhật thống kê
  if (document.getElementById("groupInfo").style.display !== "none") {
    document.getElementById("totalRolesCount").textContent = roles.length;
  }
}

function openDeleteRole(index) {
  deleteRoleIndex = index;
  openModal("deleteRoleModal");
}

function confirmDeleteRole() {
  const roleName = roles[deleteRoleIndex].name;
  const usedCount = members.filter((m) => m.role === roleName).length;

  if (usedCount > 0) {
    members = members.filter((m) => m.role !== roleName);
  }

  roles.splice(deleteRoleIndex, 1);
  saveData();
  loadRoleTable();
  loadMemberTable();
  loadRoleSelects();
  closeModal("deleteRoleModal");
  showToast(
    "Đã xoá chức vụ và " + usedCount + " thành viên liên quan",
    "warning"
  );
  updateRolePagination();
  updateMemberPagination();

  // Cập nhật thống kê
  if (document.getElementById("groupInfo").style.display !== "none") {
    document.getElementById("totalRolesCount").textContent = roles.length;
    document.getElementById("totalMembersCount").textContent = members.length;
  }
}

// Quản lý thành viên
function addMember() {
  let avatarUrl = document.getElementById("avatarUrl").value.trim();
  let fullName = document.getElementById("fullName").value.trim();
  let nickname = document.getElementById("nickname").value.trim();
  let role = document.getElementById("roleSelect").value;
  let status = document.getElementById("statusSelect").value;
  let reason = document.getElementById("reason").value.trim();

  if (!fullName || !nickname) {
    return showToast("Vui lòng nhập đủ thông tin", "error");
  }

  let roleObj = roles.find((r) => r.name === role);
  if (!roleObj) {
    return showToast("Chức vụ không tồn tại", "error");
  }

  if (roleObj.type === "limited") {
    if (members.filter((m) => m.role === role).length >= roleObj.total) {
      return showToast("Số lượng role đã đầy", "error");
    }
  }

  if (status === "Không hoạt động" && !reason) {
    return showToast("Vui lòng nhập lý do", "error");
  }

  let displayStatus =
    status === "Không hoạt động" ? `${status} (${reason})` : status;

  members.push({
    avatarUrl, // Thêm avatarUrl vào object thành viên
    fullName,
    nickname,
    role,
    status: displayStatus,
    dailyRating: 0,
    totalPoints: 0,
    lastActiveDate: null,
    violationPoints: 0,
    violationHistory: [],
  });

  saveData();
  loadMemberTable();
  loadRoleSelects();

  // Reset form
  document.getElementById("avatarUrl").value = "";
  document.getElementById("fullName").value = "";
  document.getElementById("nickname").value = "";
  document.getElementById("reason").value = "";
  document.getElementById("statusSelect").value = "Hoạt động";
  toggleReason();

  showToast("Đã thêm thành viên mới");
  updateMemberPagination();

  // Cập nhật thống kê
  if (document.getElementById("groupInfo").style.display !== "none") {
    document.getElementById("totalMembersCount").textContent = members.length;
  }
}
function loadMemberTable() {
  let tbody = document.querySelector("#memberTable tbody");
  tbody.innerHTML = "";

  const startIndex = (currentMemberPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, members.length);

  for (let i = startIndex; i < endIndex; i++) {
    const m = members[i];
    tbody.innerHTML += `
            <tr>
              <td>${i + 1}</td>
              <td>
                ${
                  m.avatarUrl
                    ? `<img src="${m.avatarUrl}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" alt="Avatar">`
                    : "No avatar"
                }
              </td>
        <td>${m.fullName}</td>
        <td>${m.nickname}</td>
        <td>${m.role}</td>
        <td>${m.status}</td>
        <td class="activity-cell">
          <div class="activity-rating">
            ${[1, 2, 3, 4, 5]
              .map(
                (star) => `
              <span class="star ${
                star <= (m.dailyRating || 0) ? "active" : ""
              }" 
                    onclick="rateMember(${star}, ${i})">★</span>
            `
              )
              .join("")}
          </div>
          <small>${m.dailyRating || 0}/5 (${m.totalPoints || 0}đ)</small>
        </td>
        <td class="violation-cell">
          <span class="violation-points ${
            m.violationPoints >= 20 ? "banned" : ""
          }">
            ${m.violationPoints || 0}đ
          </span>
          <button class="violation-btn" onclick="openViolationModal(${i})">+</button>
        </td>
        <td class="actions">
          <button class="edit-btn" onclick="openEditMember(${i})">Sửa</button>
          <button class="delete-btn" onclick="openDeleteMember(${i})">Xóa</button>
        </td>
      </tr>
    `;
  }
}

function openEditMember(index) {
  editMemberIndex = index;
  let m = members[index];
  document.getElementById("editAvatarUrl").value = m.avatarUrl || "";
  document.getElementById("editFullName").value = m.fullName;
  document.getElementById("editNickname").value = m.nickname;
  document.getElementById("editRoleSelect").value = m.role;

  if (m.status.startsWith("Không hoạt động")) {
    document.getElementById("editStatusSelect").value = "Không hoạt động";
    document.getElementById("editReason").value =
      m.status.match(/\((.*?)\)$/)?.[1] || "";
    toggleEditReason();
  } else {
    document.getElementById("editStatusSelect").value = "Hoạt động";
    document.getElementById("editReason").value = "";
    toggleEditReason();
  }

  openModal("editMemberModal");
}

function saveEditMember() {
  let avatarUrl = document.getElementById("editAvatarUrl").value.trim();
  let fullName = document.getElementById("editFullName").value.trim();
  let nickname = document.getElementById("editNickname").value.trim();
  let role = document.getElementById("editRoleSelect").value;
  let status = document.getElementById("editStatusSelect").value;
  let reason = document.getElementById("editReason").value.trim();

  if (!fullName || !nickname) {
    return showToast("Vui lòng nhập đủ thông tin", "error");
  }

  let roleObj = roles.find((r) => r.name === role);
  if (!roleObj) {
    return showToast("Chức vụ không tồn tại", "error");
  }

  if (roleObj.type === "limited") {
    const currentRole = members[editMemberIndex].role;
    const usedCount = members.filter(
      (m, i) => i !== editMemberIndex && m.role === role
    ).length;

    if (usedCount >= roleObj.total) {
      return showToast("Số lượng role đã đầy", "error");
    }
  }

  if (status === "Không hoạt động" && !reason) {
    return showToast("Vui lòng nhập lý do", "error");
  }

  let displayStatus =
    status === "Không hoạt động" ? `${status} (${reason})` : status;

  members[editMemberIndex] = {
    ...members[editMemberIndex],
    avatarUrl,
    fullName,
    nickname,
    role,
    status: displayStatus,
  };

  saveData();
  loadMemberTable();
  loadRoleTable();
  loadRoleSelects();
  closeModal("editMemberModal");
  showToast("Đã cập nhật thành viên");
}

function openDeleteMember(index) {
  deleteMemberIndex = index;
  openModal("deleteMemberModal");
}

function confirmDeleteMember() {
  members.splice(deleteMemberIndex, 1);
  saveData();
  loadMemberTable();
  loadRoleTable();
  loadRoleSelects();
  closeModal("deleteMemberModal");
  showToast("Đã xoá thành viên");
  updateMemberPagination();

  // Cập nhật thống kê
  if (document.getElementById("groupInfo").style.display !== "none") {
    document.getElementById("totalMembersCount").textContent = members.length;
  }
}

// Khởi tạo
function init() {
  // Khởi tạo groupInfo nếu chưa có
  if (!groupInfo || typeof groupInfo !== "object") {
    groupInfo = {
      rules: "",
      admins: [],
      characters: [],
    };
    saveData();
  }

  // Khởi tạo các thuộc tính mới cho thành viên nếu chưa có
  members = members.map((member) => {
    return {
      dailyRating: 0,
      totalPoints: 0,
      lastActiveDate: null,
      violationPoints: 0,
      violationHistory: [],
      rank: member.rank || "Thành viên thường", // thêm rank mặc định
      ...member,
    };
  });

  saveData();

  // Khởi tạo dữ liệu file nếu chưa có
  if (!localStorage.getItem("files")) {
    localStorage.setItem("files", JSON.stringify([]));
  }

  // Lấy dữ liệu file từ localStorage
  let files = JSON.parse(localStorage.getItem("files")) || [];

  // Cập nhật phân trang file
  updateFilePagination(files.length);

  // ===================== PHẦN MỚI =====================

  // Khởi tạo dữ liệu sticker nếu chưa có
  if (!localStorage.getItem("stickers")) {
    localStorage.setItem("stickers", JSON.stringify([]));
  }

  // Khởi tạo dữ liệu API nếu chưa có
  if (!localStorage.getItem("apiConfig")) {
    localStorage.setItem(
      "apiConfig",
      JSON.stringify({
        status: "active",
        rateLimit: 60,
        apiKey: generateRandomKey(32),
      })
    );
  }

  // Khởi tạo dữ liệu webhook nếu chưa có
  if (!localStorage.getItem("webhookConfig")) {
    localStorage.setItem(
      "webhookConfig",
      JSON.stringify({
        url: "",
        events: {
          memberJoin: true,
          memberLeave: true,
          message: false,
          violation: true,
        },
        secret: generateRandomKey(16),
      })
    );
  }

  // Load dữ liệu mới
  stickers = JSON.parse(localStorage.getItem("stickers")) || [];
  apiConfig = JSON.parse(localStorage.getItem("apiConfig")) || {};
  webhookConfig = JSON.parse(localStorage.getItem("webhookConfig")) || {};

  // ===================== PHẦN CŨ =====================

  loadRoleSelects();
  loadMemberTable();
  loadRoleTable();
  updateMemberPagination();
  updateRolePagination();
  showSection("members");
  toggleRoleLimit();
  initInteractionData();

  const originalShowSection = showSection;
  showSection = function (id) {
    originalShowSection(id);

    if (id === "interaction") {
      loadInteractionTable();
      updateLastUpdatedTime();
    }
  };
}

// Reset dữ liệu tương tác (chỉ dùng cho dev)
function resetInteractionData() {
  if (
    confirm(
      "Bạn có chắc muốn reset toàn bộ dữ liệu tương tác? Chỉ đội ngũ dev mới được thực hiện thao tác này."
    )
  ) {
    interactionData = {};
    isFinalized = false;
    localStorage.removeItem("interactionData");
    localStorage.removeItem("interactionFinalized");
    localStorage.removeItem("interactionLastUpdated");
    loadInteractionTable();
    showToast("Đã reset dữ liệu tương tác", "success");
  }
}

// ===== QUẢN LÝ CẤP BẬC =====
function updateRankStats() {
  const regularCount = members.filter(
    (m) => !m.rank || m.rank === "Thành viên thường"
  ).length;
  const vipCount = members.filter((m) => m.rank === "Thành viên ưu tú").length;
  const activeCount = members.filter(
    (m) => m.rank === "Người tương tác tốt"
  ).length;
  const belovedCount = members.filter(
    (m) => m.rank === "Người được Quản Trị Viên ưu ái"
  ).length;
  const founderCount = members.filter(
    (m) => m.rank === "Người tạo nhóm"
  ).length;

  document.getElementById("regularMembersCount").textContent = regularCount;
  document.getElementById("vipMembersCount").textContent = vipCount;
  document.getElementById("activeMembersCount").textContent = activeCount;
  document.getElementById("MembersCount").textContent = activeCount;
  document.getElementById("founderCount").textContent = founderCount;
}

function loadRankTable() {
  const tbody = document.querySelector("#rankTable tbody");
  tbody.innerHTML = "";

  const filter = document.getElementById("rankFilter").value.toLowerCase();
  const filteredMembers = members.filter(
    (m) =>
      m.nickname.toLowerCase().includes(filter) ||
      m.fullName.toLowerCase().includes(filter)
  );

  filteredMembers.forEach((member, index) => {
    const rankClass = getRankClass(member.rank || "Thành viên thường");

    tbody.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${member.nickname} (${member.fullName})</td>
          <td>
            <span class="rank-badge ${rankClass}">
              ${member.rank || "Thành viên thường"}
            </span>
          </td>
          <td>${member.totalPoints || 0}</td>
          <td>
            <select onchange="updateMemberRank('${member.id}', this.value)">
              <option value="Thành viên thường" ${
                !member.rank || member.rank === "Thành viên thường"
                  ? "selected"
                  : ""
              }>Thành viên thường</option>
              <option value="Thành viên ưu tú" ${
                member.rank === "Thành viên ưu tú" ? "selected" : ""
              }>Thành viên ưu tú</option>
              <option value="Người tương tác tốt" ${
                member.rank === "Người tương tác tốt" ? "selected" : ""
              }>Người tương tác tốt</option>
              <option value="Người được Quản Trị Viên ưu ái" ${
                member.rank === "Người được Quản Trị Viên ưu ái"
                  ? "selected"
                  : ""
              }>Người được Quản Trị Viên ưu ái</option>
              <option value="Người tạo nhóm" ${
                member.rank === "Người tạo nhóm" ? "selected" : ""
              }>Người tạo nhóm</option>
              <option value="Quản trị viên" ${
                member.rank === "Quản trị viên" ? "selected" : ""
              }>Quản trị viên</option>
            </select>
          </td>
        </tr>
      `;
  });
}

function getRankClass(rank) {
  switch (rank) {
    case "Thành viên thường":
      return "rank-regular";
    case "Thành viên ưu tú":
      return "rank-vip";
    case "Người tương tác tốt":
      return "rank-active";
    case "Người được Quản Trị Viên ưu ái":
      return "rank-beloved";
    case "Người tạo nhóm":
      return "rank-founder";
    case "Quản trị viên":
      return "rank-admin";
    default:
      return "rank-regular";
  }
}

function updateMemberRank(memberId, newRank) {
  const memberIndex = members.findIndex((m) => m.id === memberId);
  if (memberIndex !== -1) {
    members[memberIndex].rank = newRank;
    saveData();
    loadRankTable();
    updateRankStats();
    showToast("Đã cập nhật cấp bậc thành viên");
  }
}

function filterMembersByRank() {
  loadRankTable();
}

// ===== QUẢN LÝ SỰ KIỆN =====
function setupBannerUpload() {
  const bannerUpload = document.getElementById("eventBannerUpload");
  const bannerUrl = document.getElementById("eventBannerUrl");
  const preview = document.getElementById("bannerPreview");
  const previewImg = document.getElementById("previewImg");

  bannerUpload.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        previewImg.src = e.target.result;
        preview.style.display = "block";
        bannerUrl.value = e.target.result; // Data URL
      };
      reader.readAsDataURL(file);
    }
  });

  bannerUrl.addEventListener("input", function () {
    if (bannerUrl.value) {
      previewImg.src = bannerUrl.value;
      preview.style.display = "block";
    } else {
      preview.style.display = "none";
    }
  });
}

function toggleParticipantsSelection() {
  const participantsType = document.getElementById(
    "eventParticipantsType"
  ).value;
  document.getElementById("participantsSelection").style.display =
    participantsType === "selected" ? "block" : "none";
}

function loadMembersChecklist() {
  const container = document.getElementById("membersChecklist");
  container.innerHTML = "";

  members.forEach((member) => {
    const div = document.createElement("div");
    div.innerHTML = `
        <input type="checkbox" id="member-${member.id}" value="${member.id}">
        <label for="member-${member.id}">${member.nickname} (${member.fullName})</label>
      `;
    container.appendChild(div);
  });
}

function createEvent() {
  const bannerUrl = document.getElementById("eventBannerUrl").value;
  const name = document.getElementById("eventName").value;
  const description = document.getElementById("eventDescription").value;
  const startDate = document.getElementById("eventStartDate").value;
  const endDate = document.getElementById("eventEndDate").value;
  const participantsType = document.getElementById(
    "eventParticipantsType"
  ).value;
  const eventType = document.getElementById("eventType").value;

  if (!name || !startDate || !endDate) {
    showToast("Vui lòng điền đầy đủ thông tin bắt buộc", "error");
    return;
  }

  let participants = [];
  if (participantsType === "selected") {
    const checkboxes = document.querySelectorAll(
      "#membersChecklist input:checked"
    );
    participants = Array.from(checkboxes).map((cb) => cb.value);
  }

  const event = {
    id: Date.now(),
    bannerUrl,
    name,
    description,
    startDate,
    endDate,
    participants,
    eventType,
    createdAt: new Date().toISOString(),
  };

  events.push(event);
  localStorage.setItem("events", JSON.stringify(events));

  showToast("Đã tạo sự kiện mới");
  resetEventForm();
  loadEventsList();
}

function resetEventForm() {
  document.getElementById("eventBannerUrl").value = "";
  document.getElementById("eventName").value = "";
  document.getElementById("eventDescription").value = "";
  document.getElementById("eventStartDate").value = "";
  document.getElementById("eventEndDate").value = "";
  document.getElementById("eventParticipantsType").value = "all";
  document.getElementById("participantsSelection").style.display = "none";
  document.getElementById("bannerPreview").style.display = "none";

  // Bỏ chọn tất cả checkbox
  document.querySelectorAll("#membersChecklist input").forEach((cb) => {
    cb.checked = false;
  });
}

function loadEventsList() {
  const container = document.getElementById("eventsList");
  const filter = document.getElementById("eventFilter").value;
  const now = new Date();

  let filteredEvents = events;

  if (filter === "upcoming") {
    filteredEvents = events.filter((event) => new Date(event.startDate) > now);
  } else if (filter === "ongoing") {
    filteredEvents = events.filter(
      (event) =>
        new Date(event.startDate) <= now && new Date(event.endDate) >= now
    );
  } else if (filter === "past") {
    filteredEvents = events.filter((event) => new Date(event.endDate) < now);
  }

  container.innerHTML = "";

  if (filteredEvents.length === 0) {
    container.innerHTML = "<p>Chưa có sự kiện nào</p>";
    return;
  }

  filteredEvents.forEach((event) => {
    const eventElement = document.createElement("div");
    eventElement.className = "event-card";

    eventElement.innerHTML = `
        ${
          event.bannerUrl
            ? `<img src="${event.bannerUrl}" class="event-banner" alt="${event.name}">`
            : ""
        }
        <div class="event-content">
          <div class="event-title">${event.name}</div>
          <div class="event-description">${
            event.description || "Không có mô tả"
          }</div>
          <div class="event-details">
            <span>Bắt đầu: ${formatDateTime(event.startDate)}</span>
            <span>Kết thúc: ${formatDateTime(event.endDate)}</span>
          </div>
          <div class="event-type">${getEventTypeLabel(event.eventType)}</div>
          <div class="event-actions">
            <button class="edit-btn" onclick="editEvent(${
              event.id
            })">Sửa</button>
            <button class="delete-btn" onclick="deleteEvent(${
              event.id
            })">Xóa</button>
          </div>
        </div>
      `;

    container.appendChild(eventElement);
  });
}

function formatDateTime(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("vi-VN");
}

function getEventTypeLabel(type) {
  const labels = {
    online: "Online",
    offline: "Offline",
    competition: "Cuộc thi",
    meeting: "Gặp mặt",
    anniversary: "Kỷ niệm",
  };
  return labels[type] || type;
}

function filterEvents() {
  loadEventsList();
}

function editEvent(eventId) {
  // Triển khai chức năng chỉnh sửa sự kiện
  showToast("Chức năng chỉnh sửa sự kiện đang được phát triển", "info");
}

function deleteEvent(eventId) {
  if (confirm("Bạn có chắc muốn xóa sự kiện này?")) {
    events = events.filter((event) => event.id !== eventId);
    localStorage.setItem("events", JSON.stringify(events));
    loadEventsList();
    showToast("Đã xóa sự kiện");
  }
}

// ===== QUẢN LÝ FILE VÀ TÀI LIỆU =====
function setupFileUpload() {
  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileUpload");

  // Kéo thả file
  uploadArea.addEventListener("dragover", function (e) {
    e.preventDefault();
    uploadArea.style.borderColor = "#4f46e5";
    uploadArea.style.backgroundColor = "#f5f7ff";
  });

  uploadArea.addEventListener("dragleave", function () {
    uploadArea.style.borderColor = "#ccc";
    uploadArea.style.backgroundColor = "";
  });

  uploadArea.addEventListener("drop", function (e) {
    e.preventDefault();
    uploadArea.style.borderColor = "#ccc";
    uploadArea.style.backgroundColor = "";

    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  });

  // Click để chọn file
  uploadArea.addEventListener("click", function () {
    fileInput.click();
  });
}

function handleFileSelect(fileList) {
  selectedFiles = Array.from(fileList);
  const fileListContainer = document.getElementById("fileList");
  const selectedFilesContainer = document.getElementById("selectedFiles");

  fileListContainer.innerHTML = "";

  if (selectedFiles.length > 0) {
    selectedFilesContainer.style.display = "block";

    selectedFiles.forEach((file, index) => {
      const li = document.createElement("li");
      li.className = "file-item";

      const extension = file.name.split(".").pop().toUpperCase();
      const fileSize = formatFileSize(file.size);

      li.innerHTML = `
          <div class="file-icon">${extension}</div>
          <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-details">${fileSize}</div>
          </div>
          <button class="delete-btn" onclick="removeSelectedFile(${index})">Xóa</button>
        `;

      fileListContainer.appendChild(li);
    });

    // Tự động điền tên file đầu tiên vào ô tên tài liệu
    if (!document.getElementById("fileName").value) {
      const firstName = selectedFiles[0].name.split(".")[0];
      document.getElementById("fileName").value = firstName;
    }
  } else {
    selectedFilesContainer.style.display = "none";
  }
}

function removeSelectedFile(index) {
  selectedFiles.splice(index, 1);
  handleFileSelect(selectedFiles); // Refresh danh sách
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function loadFileAccessChecklist() {
  const container = document.getElementById("fileAccessChecklist");
  container.innerHTML = "";

  members.forEach((member) => {
    const div = document.createElement("div");
    div.innerHTML = `
        <input type="checkbox" id="file-access-${member.id}" value="${member.id}">
        <label for="file-access-${member.id}">${member.nickname} (${member.fullName})</label>
      `;
    container.appendChild(div);
  });

  // Hiển/ẩn phần chọn thành viên dựa trên quyền truy cập
  document.getElementById("fileAccess").addEventListener("change", function () {
    document.getElementById("fileAccessSelection").style.display =
      this.value === "selected" ? "block" : "none";
  });
}

function uploadFiles() {
  if (selectedFiles.length === 0) {
    showToast("Vui lòng chọn ít nhất một file", "error");
    return;
  }

  const fileName = document.getElementById("fileName").value;
  const fileDescription = document.getElementById("fileDescription").value;
  const fileCategory = document.getElementById("fileCategory").value;
  const fileAccess = document.getElementById("fileAccess").value;

  if (!fileName) {
    showToast("Vui lòng nhập tên tài liệu", "error");
    return;
  }

  let allowedMembers = [];
  if (fileAccess === "selected") {
    const checkboxes = document.querySelectorAll(
      "#fileAccessChecklist input:checked"
    );
    allowedMembers = Array.from(checkboxes).map((cb) => cb.value);
  }

  // Đọc nội dung file dưới dạng Base64
  const reader = new FileReader();
  reader.onload = function (e) {
    const fileData = e.target.result;

    const newFile = {
      id: Date.now(),
      name: fileName,
      description: fileDescription,
      category: fileCategory,
      access: fileAccess,
      allowedMembers: allowedMembers,
      originalName: selectedFiles[0].name,
      size: selectedFiles[0].size,
      type: selectedFiles[0].type,
      data: fileData, // Lưu dữ liệu file dưới dạng Base64
      uploadDate: new Date().toISOString(),
      uploader: "Admin", // Có thể thay bằng thông tin người upload thực tế
    };

    files.push(newFile);
    localStorage.setItem("files", JSON.stringify(files));

    showToast("Đã tải lên tài liệu thành công");
    resetFileForm();
    loadFilesTable();
  };

  reader.readAsDataURL(selectedFiles[0]);
}

function resetFileForm() {
  document.getElementById("fileName").value = "";
  document.getElementById("fileDescription").value = "";
  document.getElementById("fileCategory").value = "general";
  document.getElementById("fileAccess").value = "public";
  document.getElementById("fileAccessSelection").style.display = "none";
  document.getElementById("selectedFiles").style.display = "none";
  selectedFiles = [];

  // Bỏ chọn tất cả checkbox
  document.querySelectorAll("#fileAccessChecklist input").forEach((cb) => {
    cb.checked = false;
  });
}

function loadFilesTable() {
  const tbody = document.querySelector("#filesTable tbody");
  tbody.innerHTML = "";

  const searchTerm = document.getElementById("fileSearch").value.toLowerCase();
  const categoryFilter = document.getElementById("fileCategoryFilter").value;
  const sortBy = document.getElementById("fileSort").value;

  // Lọc file
  let filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchTerm) ||
      file.description.toLowerCase().includes(searchTerm);
    const matchesCategory =
      categoryFilter === "all" || file.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Sắp xếp file
  filteredFiles.sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.uploadDate) - new Date(a.uploadDate);
      case "oldest":
        return new Date(a.uploadDate) - new Date(b.uploadDate);
      case "name":
        return a.name.localeCompare(b.name);
      case "size":
        return b.size - a.size;
      default:
        return 0;
    }
  });

  // Phân trang
  const startIndex = (currentFilePage - 1) * filesPerPage;
  const endIndex = Math.min(startIndex + filesPerPage, filteredFiles.length);
  const pageFiles = filteredFiles.slice(startIndex, endIndex);

  if (pageFiles.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align: center;">Không có tài liệu nào</td></tr>';
  } else {
    pageFiles.forEach((file) => {
      const uploadDate = new Date(file.uploadDate).toLocaleDateString("vi-VN");
      const fileSize = formatFileSize(file.size);

      tbody.innerHTML += `
          <tr>
            <td>
              <div style="display: flex; align-items: center;">
                <div class="file-icon" style="margin-right: 10px;">${file.originalName
                  .split(".")
                  .pop()
                  .toUpperCase()}</div>
                <div>
                  <div style="font-weight: 500;">${file.name}</div>
                  <div style="font-size: 12px; color: #6b7280;">${
                    file.description || "Không có mô tả"
                  }</div>
                </div>
              </div>
            </td>
            <td><span class="file-type-badge file-type-${
              file.category
            }">${getCategoryLabel(file.category)}</span></td>
            <td>${fileSize}</td>
            <td>${uploadDate}</td>
            <td><span class="file-access-badge">${getAccessLabel(
              file.access
            )}</span></td>
            <td>
              <div class="actions">
                <button class="edit-btn" onclick="downloadFile(${
                  file.id
                })">Tải xuống</button>
                <button class="delete-btn" onclick="deleteFile(${
                  file.id
                })">Xóa</button>
              </div>
            </td>
          </tr>
        `;
    });
  }

  updateFilePagination(filteredFiles.length);
}

function getCategoryLabel(category) {
  const labels = {
    general: "Chung",
    rules: "Quy định",
    tutorials: "Hướng dẫn",
    templates: "Mẫu",
    reports: "Báo cáo",
    others: "Khác",
  };
  return labels[category] || category;
}

function getAccessLabel(access) {
  const labels = {
    public: "Tất cả",
    vip: "Thành viên ưu tú",
    mods: "Quản trị viên",
    selected: "Chọn lọc",
  };
  return labels[access] || access;
}

function downloadFile(fileId) {
  const file = files.find((f) => f.id === fileId);
  if (!file) return;

  // Tạo link tải xuống
  const link = document.createElement("a");
  link.href = file.data;
  link.download = file.originalName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("Đã bắt đầu tải xuống file");
}

function deleteFile(fileId) {
  files = files.filter((f) => f.id !== fileId);
  localStorage.setItem("files", JSON.stringify(files));
  loadFilesTable();
  showToast("Đã xóa tài liệu");
}

function filterFiles() {
  currentFilePage = 1;
  loadFilesTable();
}

function updateFilePagination(totalFiles) {
  const totalPages = Math.ceil(totalFiles / filesPerPage);
  document.getElementById("filePrevBtn").disabled = currentFilePage <= 1;
  document.getElementById("fileNextBtn").disabled =
    currentFilePage >= totalPages || totalPages === 0;
  document.getElementById(
    "filePageInfo"
  ).textContent = `Trang ${currentFilePage}/${totalPages > 0 ? totalPages : 1}`;
}

function prevFilePage() {
  if (currentFilePage > 1) {
    currentFilePage--;
    loadFilesTable();
  }
}

function nextFilePage() {
  const totalPages = Math.ceil(files.length / filesPerPage);
  if (currentFilePage < totalPages) {
    currentFilePage++;
    loadFilesTable();
  }
}

// ===== QUẢN LÝ STICKER/EMOJI =====
let stickers = JSON.parse(localStorage.getItem("stickers")) || [];
let currentStickerPage = 1;
const stickersPerPage = 12;

function toggleStickerInput() {
  const type = document.getElementById("stickerType").value;
  document.getElementById("stickerImageInput").style.display =
    type === "emoji" ? "none" : "block";
  document.getElementById("stickerEmojiInput").style.display =
    type === "emoji" ? "block" : "none";
}

function handleStickerUpload(files) {
  if (files.length > 0) {
    const file = files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      document.getElementById("stickerImageUrl").value = e.target.result;
    };

    reader.readAsDataURL(file);
  }
}

function addSticker() {
  const name = document.getElementById("stickerName").value.trim();
  const type = document.getElementById("stickerType").value;
  const category = document.getElementById("stickerCategory").value.trim();
  const access = document.getElementById("stickerAccess").value;

  if (!name) {
    showToast("Vui lòng nhập tên sticker/emoji", "error");
    return;
  }

  let content = "";
  if (type === "emoji") {
    content = document.getElementById("stickerEmoji").value.trim();
    if (!content) {
      showToast("Vui lòng nhập emoji", "error");
      return;
    }
  } else {
    content = document.getElementById("stickerImageUrl").value.trim();
    if (!content) {
      showToast("Vui lòng thêm URL hình ảnh", "error");
      return;
    }
  }

  const sticker = {
    id: Date.now(),
    name,
    type,
    content,
    category: category || "Khác",
    access,
    createdAt: new Date().toISOString(),
    usageCount: 0,
  };

  stickers.push(sticker);
  localStorage.setItem("stickers", JSON.stringify(stickers));

  showToast("Đã thêm sticker/emoji mới");
  loadStickers();
  updateStickerCategories();

  // Reset form
  document.getElementById("stickerName").value = "";
  document.getElementById("stickerImageUrl").value = "";
  document.getElementById("stickerEmoji").value = "";
  document.getElementById("stickerCategory").value = "";
}

function loadStickers() {
  const container = document.getElementById("stickersContainer");
  container.innerHTML = "";

  const searchTerm = document
    .getElementById("stickerSearch")
    .value.toLowerCase();
  const categoryFilter = document.getElementById("stickerCategoryFilter").value;
  const typeFilter = document.getElementById("stickerTypeFilter").value;

  // Lọc sticker
  let filteredStickers = stickers.filter((sticker) => {
    const matchesSearch = sticker.name.toLowerCase().includes(searchTerm);
    const matchesCategory =
      categoryFilter === "all" || sticker.category === categoryFilter;
    const matchesType = typeFilter === "all" || sticker.type === typeFilter;

    return matchesSearch && matchesCategory && matchesType;
  });

  // Phân trang
  const startIndex = (currentStickerPage - 1) * stickersPerPage;
  const endIndex = Math.min(
    startIndex + stickersPerPage,
    filteredStickers.length
  );
  const pageStickers = filteredStickers.slice(startIndex, endIndex);

  if (pageStickers.length === 0) {
    container.innerHTML = "<p>Không có sticker nào</p>";
  } else {
    pageStickers.forEach((sticker) => {
      const stickerElement = document.createElement("div");
      stickerElement.className = "sticker-item";

      if (sticker.type === "emoji") {
        stickerElement.innerHTML = `
                            <div class="sticker-image" style="font-size: 48px; display: flex; align-items: center; justify-content: center;">
                                ${sticker.content}
                            </div>
                            <div class="sticker-name">${sticker.name}</div>
                            <div class="sticker-actions">
                                <button class="edit-btn" onclick="editSticker(${sticker.id})">Sửa</button>
                                <button class="delete-btn" onclick="deleteSticker(${sticker.id})">Xóa</button>
                            </div>
                        `;
      } else {
        stickerElement.innerHTML = `
                            <img src="${sticker.content}" class="sticker-image" alt="${sticker.name}">
                            <div class="sticker-name">${sticker.name}</div>
                            <div class="sticker-actions">
                                <button class="edit-btn" onclick="editSticker(${sticker.id})">Sửa</button>
                                <button class="delete-btn" onclick="deleteSticker(${sticker.id})">Xóa</button>
                            </div>
                        `;
      }

      container.appendChild(stickerElement);
    });
  }

  updateStickerPagination(filteredStickers.length);
}

function updateStickerPagination(totalStickers) {
  const totalPages = Math.ceil(totalStickers / stickersPerPage);
  document.getElementById("stickerPrevBtn").disabled = currentStickerPage <= 1;
  document.getElementById("stickerNextBtn").disabled =
    currentStickerPage >= totalPages || totalPages === 0;
  document.getElementById(
    "stickerPageInfo"
  ).textContent = `Trang ${currentStickerPage}/${
    totalPages > 0 ? totalPages : 1
  }`;
}

function prevStickerPage() {
  if (currentStickerPage > 1) {
    currentStickerPage--;
    loadStickers();
  }
}

function nextStickerPage() {
  const totalPages = Math.ceil(stickers.length / stickersPerPage);
  if (currentStickerPage < totalPages) {
    currentStickerPage++;
    loadStickers();
  }
}

function filterStickers() {
  currentStickerPage = 1;
  loadStickers();
}

function updateStickerCategories() {
  const categories = [...new Set(stickers.map((s) => s.category))];
  const filter = document.getElementById("stickerCategoryFilter");

  filter.innerHTML = '<option value="all">Tất cả danh mục</option>';
  categories.forEach((category) => {
    filter.innerHTML += `<option value="${category}">${category}</option>`;
  });
}

function editSticker(id) {
  // Triển khai chức năng chỉnh sửa sticker
  showToast("Chức năng chỉnh sửa sticker đang được phát triển", "info");
}

function deleteSticker(id) {
  // Xóa luôn không cần confirm
  stickers = stickers.filter((s) => s.id !== id);
  localStorage.setItem("stickers", JSON.stringify(stickers));
  loadStickers();
  showToast("Đã xóa sticker/emoji");
}

// ===== QUẢN LÝ API/WEBHOOK =====
let apiConfig = JSON.parse(localStorage.getItem("apiConfig")) || {
  status: "active",
  rateLimit: 60,
  apiKey: generateRandomKey(32),
};

let webhookConfig = JSON.parse(localStorage.getItem("webhookConfig")) || {
  url: "",
  events: {
    memberJoin: true,
    memberLeave: true,
    message: false,
    violation: true,
  },
  secret: generateRandomKey(16),
};

function generateRandomKey(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function revealApiKey() {
  document.getElementById("apiKey").textContent = apiConfig.apiKey;
}

function generateNewApiKey() {
  apiConfig.apiKey = generateRandomKey(32);
  localStorage.setItem("apiConfig", JSON.stringify(apiConfig));
  document.getElementById("apiKey").textContent = "••••••••••••••••";
  showToast("Đã tạo API key mới");
}

function saveApiConfig() {
  apiConfig.status = document.getElementById("apiStatus").value;
  apiConfig.rateLimit =
    parseInt(document.getElementById("apiRateLimit").value) || 60;

  localStorage.setItem("apiConfig", JSON.stringify(apiConfig));
  showToast("Đã lưu cấu hình API");
}

function saveWebhookConfig() {
  webhookConfig.url = document.getElementById("webhookUrl").value;
  webhookConfig.events = {
    memberJoin: document.getElementById("eventMemberJoin").checked,
    memberLeave: document.getElementById("eventMemberLeave").checked,
    message: document.getElementById("eventMessage").checked,
    violation: document.getElementById("eventViolation").checked,
  };
  webhookConfig.secret = document.getElementById("webhookSecret").value;

  localStorage.setItem("webhookConfig", JSON.stringify(webhookConfig));
  showToast("Đã lưu cấu hình Webhook");
}

function testEndpoint(method, endpoint) {
  showToast(`Đang test ${method} ${endpoint}...`, "info");

  // Giả lập kết quả test API
  setTimeout(() => {
    const result = {
      status: "success",
      method: method,
      endpoint: endpoint,
      timestamp: new Date().toISOString(),
      response: {
        status: 200,
        data: method === "GET" ? { message: "Request thành công" } : null,
      },
    };

    showToast(`Test ${method} ${endpoint} thành công`, "success");
    console.log("Kết quả test API:", result);
  }, 1000);
}

function testWebhook() {
  const url = document.getElementById("webhookUrl").value;

  if (!url) {
    showToast("Vui lòng nhập URL webhook", "error");
    return;
  }

  showToast("Đang test webhook...", "info");

  // Giả lập gửi webhook
  setTimeout(() => {
    const resultArea = document.getElementById("webhookResult");
    resultArea.style.display = "block";
    resultArea.textContent = JSON.stringify(
      {
        status: "success",
        message: "Webhook delivered successfully",
        url: url,
        timestamp: new Date().toISOString(),
        payload: {
          event: "test",
          data: {
            message: "Đây là test webhook từ KNY Management System",
          },
        },
      },
      null,
      2
    );

    showToast("Test webhook thành công", "success");
  }, 1500);
}

function loadApiConfig() {
  document.getElementById("apiStatus").value = apiConfig.status || "active";
  document.getElementById("apiRateLimit").value = apiConfig.rateLimit || 60;

  document.getElementById("webhookUrl").value = webhookConfig.url || "";
  document.getElementById("eventMemberJoin").checked =
    webhookConfig.events?.memberJoin !== false;
  document.getElementById("eventMemberLeave").checked =
    webhookConfig.events?.memberLeave !== false;
  document.getElementById("eventMessage").checked =
    webhookConfig.events?.message || false;
  document.getElementById("eventViolation").checked =
    webhookConfig.events?.violation !== false;
  document.getElementById("webhookSecret").value = webhookConfig.secret || "";
}

// Cập nhật hàm showSection để load dữ liệu khi chuyển section
const originalShowSection = showSection;
showSection = function (id) {
  originalShowSection(id);

  if (id === "stickers") {
    loadStickers();
    updateStickerCategories();
  } else if (id === "apiWebhook") {
    loadApiConfig();
  }
};

// Hàm hiển thị section quản lý tài khoản admin
function showAdminAccountSection() {
  loadAdminAccountData();
  showSection("adminAccount");
}

// Hàm tải dữ liệu tài khoản admin
function loadAdminAccountData() {
  const STORAGE_KEY = "kny_admin_account";
  const adminData = localStorage.getItem(STORAGE_KEY);

  if (!adminData) {
    document.getElementById("adminAccountInfo").innerHTML =
      '<p style="color: var(--error)"><i class="fas fa-exclamation-triangle"></i> Không tìm thấy thông tin tài khoản admin. Vui lòng tạo tài khoản admin trước.</p>';
    return;
  }

  try {
    const admin = JSON.parse(adminData);

    // Điền thông tin vào form
    document.getElementById("adminUsername").value = admin.username || "";
    document.getElementById("adminBirthdate").value = admin.birthdate || "";
    document.getElementById("adminPhone").value = admin.phone || "";

    // Hiển thị thông tin bổ sung
    document.getElementById("adminCreatedAt").textContent = admin.createdAt
      ? new Date(admin.createdAt).toLocaleString("vi-VN")
      : "Không có thông tin";
    document.getElementById("adminUpdatedAt").textContent = admin.updatedAt
      ? new Date(admin.updatedAt).toLocaleString("vi-VN")
      : "Không có thông tin";
  } catch (e) {
    console.error("Lỗi khi phân tích dữ liệu admin:", e);
    document.getElementById("adminAccountInfo").innerHTML =
      '<p style="color: var(--error)"><i class="fas fa-exclamation-triangle"></i> Dữ liệu tài khoản admin không hợp lệ.</p>';
  }
}

// Hàm băm mật khẩu (SHA-256)
async function sha256Hex(message) {
  const enc = new TextEncoder();
  const data = enc.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Xử lý form cập nhật thông tin admin
document
  .getElementById("adminAccountForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const STORAGE_KEY = "kny_admin_account";
    const messageArea = document.getElementById("adminAccountMessage");
    messageArea.textContent = "";
    messageArea.className = "note";

    // Lấy dữ liệu từ form
    const username = document.getElementById("adminUsername").value.trim();
    const birthdate = document.getElementById("adminBirthdate").value;
    const phone = document.getElementById("adminPhone").value.trim();
    const password = document.getElementById("adminPassword").value;
    const confirmPassword = document.getElementById(
      "adminConfirmPassword"
    ).value;

    // Kiểm tra dữ liệu
    if (!username || !birthdate || !phone) {
      showToast("Vui lòng điền đầy đủ thông tin.", "error");
      return;
    }

    // Kiểm tra số điện thoại hợp lệ
    if (!isValidPhone(phone)) {
      showToast(
        "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam.",
        "error"
      );
      return;
    }

    // Kiểm tra mật khẩu nếu có thay đổi
    if (password) {
      if (password.length < 6) {
        showToast("Mật khẩu tối thiểu 6 ký tự.", "error");
        return;
      }

      if (password !== confirmPassword) {
        showToast("Mật khẩu xác nhận không khớp.", "error");
        return;
      }
    }

    try {
      // Lấy dữ liệu admin hiện tại
      const existingData = localStorage.getItem(STORAGE_KEY);
      if (!existingData) {
        showToast("Không tìm thấy tài khoản admin.", "error");
        return;
      }

      const admin = JSON.parse(existingData);

      // Cập nhật thông tin
      admin.username = username;
      admin.birthdate = birthdate;
      admin.phone = phone;
      admin.updatedAt = new Date().toISOString();

      // Cập nhật mật khẩu nếu có
      if (password) {
        admin.passwordHash = await sha256Hex(password);
      }

      // Lưu lại vào localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(admin));

      showToast("Cập nhật thông tin thành công!", "success");

      // Làm mới dữ liệu hiển thị
      loadAdminAccountData();
    } catch (err) {
      console.error("Lỗi khi cập nhật thông tin admin:", err);
      showToast("Có lỗi xảy ra khi cập nhật thông tin.", "error");
    }
  });

// Kiểm tra số điện thoại hợp lệ (Việt Nam)
function isValidPhone(phone) {
  const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
  return phoneRegex.test(phone);
}

// Xuất dữ liệu admin
function exportAdminData() {
  const STORAGE_KEY = "kny_admin_account";
  const adminData = localStorage.getItem(STORAGE_KEY);

  if (!adminData) {
    showToast("Không có dữ liệu để xuất.", "error");
    return;
  }

  try {
    const admin = JSON.parse(adminData);
    const dataStr = JSON.stringify(admin, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `kny_admin_backup_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    showToast("Đã xuất dữ liệu thành công.", "success");
  } catch (e) {
    console.error("Lỗi khi xuất dữ liệu admin:", e);
    showToast("Có lỗi xảy ra khi xuất dữ liệu.", "error");
  }
}

// Hiển thị form đổi mật khẩu
function showChangePasswordForm() {
  document.getElementById("adminPassword").value = "";
  document.getElementById("adminConfirmPassword").value = "";
  document.getElementById("adminPassword").focus();

  showToast("Vui lòng nhập mật khẩu mới nếu bạn muốn thay đổi.", "info");
}

// Xem thông tin admin
function viewAdminInfo() {
  const STORAGE_KEY = "kny_admin_account";
  const adminData = localStorage.getItem(STORAGE_KEY);

  if (!adminData) {
    showToast("Không tìm thấy thông tin tài khoản admin.", "error");
    return;
  }

  try {
    const admin = JSON.parse(adminData);

    // Điền thông tin vào modal
    document.getElementById("viewUsername").textContent =
      admin.username || "Không có";
    document.getElementById("viewBirthdate").textContent =
      admin.birthdate || "Không có";
    document.getElementById("viewPhone").textContent =
      admin.phone || "Không có";
    document.getElementById("viewCreatedAt").textContent = admin.createdAt
      ? new Date(admin.createdAt).toLocaleString("vi-VN")
      : "Không có";
    document.getElementById("viewUpdatedAt").textContent = admin.updatedAt
      ? new Date(admin.updatedAt).toLocaleString("vi-VN")
      : "Không có";

    // Hiển thị modal
    document.getElementById("viewAdminModal").style.display = "block";
  } catch (e) {
    console.error("Lỗi khi phân tích dữ liệu admin:", e);
    showToast("Dữ liệu tài khoản admin không hợp lệ.", "error");
  }
}

// Chuyển đổi hiển thị mật khẩu
document
  .getElementById("adminPasswordToggle")
  .addEventListener("click", function () {
    const passwordEl = document.getElementById("adminPassword");
    if (passwordEl.type === "password") {
      passwordEl.type = "text";
      this.classList.remove("fa-eye");
      this.classList.add("fa-eye-slash");
    } else {
      passwordEl.type = "password";
      this.classList.remove("fa-eye-slash");
      this.classList.add("fa-eye");
    }
  });

// Hàm lọc thành viên
function filterMembers() {
  const searchText = document
    .getElementById("memberSearch")
    .value.toLowerCase();
  const statusFilter = document.getElementById("statusFilter").value;
  const memberTable = document.getElementById("memberTable");
  const rows = memberTable
    .getElementsByTagName("tbody")[0]
    .getElementsByTagName("tr");

  for (let i = 0; i < rows.length; i++) {
    const nickname = rows[i].cells[3].textContent.toLowerCase();
    const fullname = rows[i].cells[2].textContent.toLowerCase();
    const status = rows[i].cells[5].textContent;

    const matchesSearch =
      nickname.includes(searchText) || fullname.includes(searchText);
    const matchesStatus = statusFilter === "all" || status === statusFilter;

    rows[i].style.display = matchesSearch && matchesStatus ? "" : "none";
  }
}

// Hàm reset tìm kiếm
function resetSearch() {
  document.getElementById("memberSearch").value = "";
  document.getElementById("statusFilter").value = "all";
  filterMembers();
}

// Đóng modal
function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Đóng modal khi click bên ngoài
window.onclick = function (event) {
  const modals = document.getElementsByClassName("modal");
  for (let i = 0; i < modals.length; i++) {
    if (event.target === modals[i]) {
      modals[i].style.display = "none";
    }
  }
};

// Chạy khi trang tải xong
window.onload = init;
