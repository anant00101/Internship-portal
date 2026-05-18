
  // Auth guard
  Auth.requireAuth('student');

  const avatarColors = ['rgba(59,130,246,0.15):#60a5fa','rgba(234,88,12,0.15):#fb923c','rgba(124,58,237,0.15):#a78bfa','rgba(16,185,129,0.15):#10b981','rgba(236,72,153,0.15):#ec4899'];
  function getAvatarStyle(name=''){const idx=(name.charCodeAt(0)||0)%avatarColors.length;const[bg,color]=avatarColors[idx].split(':');return{bg,color,letter:name.charAt(0).toUpperCase()||'?'};}

  function statusClass(s) { return 'status-' + s.replace(' ', '-'); }

  document.getElementById('logoutBtn').onclick = () => Auth.logout();

  let profileModalInstance = null;

  function openProfileModal() {
    const u = Auth.getUser();
    if (!u) return;
    document.getElementById('editCollege').value = u.college || '';
    document.getElementById('editDegree').value = u.degree || '';
    document.getElementById('editYear').value = u.graduationYear || '';
    document.getElementById('editSkills').value = (u.skills || []).join(', ');
    document.getElementById('editResume').value = u.resumeUrl || '';
    document.getElementById('profileError').style.display = 'none';

    if (!profileModalInstance) {
      profileModalInstance = new bootstrap.Modal(document.getElementById('profileModal'));
    }
    profileModalInstance.show();
  }

  async function saveProfile() {
    const btn = document.getElementById('saveProfileBtn');
    const err = document.getElementById('profileError');
    err.style.display = 'none';

    const payload = {
      college: document.getElementById('editCollege').value.trim(),
      degree: document.getElementById('editDegree').value.trim(),
      graduationYear: document.getElementById('editYear').value.trim(),
      skills: document.getElementById('editSkills').value.split(',').map(s => s.trim()).filter(s => s),
      resumeUrl: document.getElementById('editResume').value.trim()
    };

    UI.setLoading(btn, true);
    const res = await AuthAPI.updateProfile(payload);
    UI.setLoading(btn, false);

    if (!res.success) {
      err.textContent = res.error;
      err.style.display = 'block';
      return;
    }

    const token = Auth.getToken();
    Auth.saveUser(token, res.data.data); // save updated user

    profileModalInstance.hide();
    UI.showToast('Profile updated successfully! ✨', 'success');
    loadDashboard();
  }

  async function loadDashboard() {
    // Load user info
    const meResult = await AuthAPI.getMe();
    if (meResult.success) {
      const u = meResult.data.data;
      const initials = (u.firstName?.[0] || '') + (u.lastName?.[0] || '');
      document.getElementById('avatarInitial').textContent = initials;
      document.getElementById('userName').textContent = u.firstName + ' ' + u.lastName;
      document.getElementById('userCollege').textContent = u.college || 'Student';
      document.getElementById('greetName').textContent = u.firstName;

      // Profile completeness
      const checks = [
        { label: 'Basic Info', done: !!(u.firstName && u.email) },
        { label: 'Skills Added', done: !!(u.skills && u.skills.length > 0) },
        { label: 'Resume Uploaded', done: !!u.resumeUrl },
        { label: 'College Added', done: !!u.college },
      ];
      const pct = Math.round((checks.filter(c => c.done).length / checks.length) * 100);
      document.getElementById('profilePct').textContent = pct + '%';
      document.getElementById('profileBar').style.width = pct + '%';
      document.getElementById('profileChecks').innerHTML = checks.map(c => `
        <div class="d-flex align-items-center gap-2 mb-1" style="color:${c.done ? '#10b981' : 'var(--text-muted)'};">
          <i class="bi bi-${c.done ? 'check-circle-fill' : 'circle'}"></i> ${c.label}
        </div>`).join('');
    }

    // Load applications
    const appResult = await ApplicationAPI.getMyApplications();
    const container = document.getElementById('applicationsContainer');

    if (!appResult.success) {
      container.innerHTML = `<div class="muted-text text-center p-4">Failed to load applications.</div>`;
      return;
    }

    const apps = appResult.data.data;

    // Update stats
    document.getElementById('statTotal').textContent = apps.length;
    document.getElementById('statShortlisted').textContent = apps.filter(a => a.status === 'Shortlisted').length;
    document.getElementById('statReview').textContent = apps.filter(a => a.status === 'Under Review').length;
    document.getElementById('statOffered').textContent = apps.filter(a => a.status === 'Offered').length;

    const newCount = apps.filter(a => {
      const hrs = (Date.now() - new Date(a.updatedAt)) / 3600000;
      return hrs < 48;
    }).length;
    document.getElementById('greetSub').textContent = newCount > 0
      ? `You have ${newCount} update${newCount > 1 ? 's' : ''} on your applications.`
      : `You have ${apps.length} application${apps.length !== 1 ? 's' : ''} in progress.`;

    if (!apps.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:3rem 0;color:var(--text-muted);">
          <i class="bi bi-send" style="font-size:2.5rem;display:block;margin-bottom:1rem;"></i>
          <div style="font-weight:600;margin-bottom:0.5rem;">No applications yet</div>
          <a href="internships.html" class="btn btn-accent btn-sm mt-2">Browse Internships</a>
        </div>`;
      return;
    }

    container.innerHTML = apps.map(app => {
      const intern = app.internship || {};
      const av = getAvatarStyle(intern.companyName || '');
      const daysAgo = Math.floor((Date.now() - new Date(app.createdAt)) / 86400000);
      return `
        <div class="app-row">
          <div class="d-flex align-items-center gap-3">
            <div class="company-logo-sm" style="background:${av.bg};color:${av.color};">${av.letter}</div>
            <div class="flex-grow-1">
              <div style="font-weight:600;font-size:0.9rem;">${intern.title || '—'}</div>
              <div class="muted-text" style="font-size:0.8rem;">${intern.companyName || '—'} · ${intern.workType || ''} · ${intern.stipend?.amount ? '₹'+intern.stipend.amount.toLocaleString('en-IN')+'/mo' : ''}</div>
            </div>
            <div class="text-end">
              <span class="status-badge ${statusClass(app.status)}">${app.status}</span>
              <div class="muted-text" style="font-size:0.72rem;margin-top:3px;">Applied ${daysAgo === 0 ? 'today' : daysAgo + ' day' + (daysAgo > 1 ? 's' : '') + ' ago'}</div>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  loadDashboard();

