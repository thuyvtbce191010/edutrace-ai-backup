export function updateRoleWorkspace(user, root = document) {
  const workspace = root.getElementById("roleWorkspace");
  if (!workspace) return;
  const doctor = user?.role === "doctor";
  const investor = user?.role === "investor";
  workspace.hidden = !doctor && !investor;
  root.getElementById("doctorWorkspace").hidden = !doctor;
  root.getElementById("investorWorkspace").hidden = !investor;
  const clinical = root.getElementById("clinicalPanel");
  if (clinical) clinical.style.display = doctor ? '' : 'none';
  const report = root.getElementById("investorReportPanel");
  if (report) report.style.display = investor ? '' : 'none';
  if (!doctor && !investor) return;
  root.getElementById("roleWorkspaceBadge").textContent = doctor ? "Bác sĩ / Chuyên viên" : "Nhà đầu tư / Đối tác";
  root.getElementById("roleWorkspaceTitle").textContent = doctor ? "Không gian chuyên môn" : "Không gian đối tác";
  root.getElementById("roleWorkspaceGreeting").textContent = `Xin chào ${user.displayName || "bạn"}. Khám phá các công cụ và thông tin dành cho bạn.`;
}
