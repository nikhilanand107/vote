document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // Decode token to find role without making API call first if possible
    let tokenPayload = null;
    try {
        tokenPayload = JSON.parse(atob(token.split('.')[1]));
    } catch(e) {}

    const logoutBtn = document.getElementById('logout-btn');
    const userGreeting = document.getElementById('user-greeting');
    const voteStatus = document.getElementById('vote-status');
    const candidatesGrid = document.getElementById('candidates-grid');
    const adminSection = document.getElementById('admin-section');
    const addCandidateForm = document.getElementById('add-candidate-form');
    const adminError = document.getElementById('admin-error');
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-candidate-form');

    let currentUser = null;

    const fetchProfile = async () => {
        try {
            const endpoint = tokenPayload?.role === 'candidate' ? '/candidate/profile' : '/user/profile';
            const res = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (res.ok) {
                currentUser = data.user || data.candidate;
                // If it's candidate payload, override role explicitly for frontend checks
                if(tokenPayload?.role === 'candidate') {
                    currentUser.role = 'candidate';
                }

                userGreeting.textContent = `Welcome, ${currentUser.name} (${currentUser.role || 'voter'})`;
                
                if (currentUser.role === 'candidate') {
                    voteStatus.textContent = `My Total Votes: ${currentUser.voteCount}`;
                    voteStatus.classList.remove('hidden');
                } else if (currentUser.isVoted) {
                    voteStatus.textContent = `Already Voted`;
                    voteStatus.classList.remove('hidden');
                }
                
                if (currentUser.role === 'admin') {
                    adminSection.classList.remove('hidden');
                }
            } else {
                localStorage.removeItem('token');
                window.location.href = '/';
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            userGreeting.textContent = 'Error loading profile';
        }
    };

    const fetchCandidates = async () => {
        try {
            const res = await fetch('/candidate');
            const data = await res.json();
            if (res.ok) {
                renderCandidates(data);
            } else {
                candidatesGrid.innerHTML = '<div style="color: var(--danger-color);">Failed to load candidates.</div>';
            }
        } catch (err) {
            candidatesGrid.innerHTML = '<div style="color: var(--danger-color);">Network error.</div>';
        }
    };

    const renderCandidates = (candidates) => {
        candidatesGrid.innerHTML = '';
        if (candidates.length === 0) {
            candidatesGrid.innerHTML = '<div style="color: var(--text-secondary);">No candidates found.</div>';
            return;
        }
        
        candidates.forEach(cand => {
            const card = document.createElement('div');
            card.className = 'glass-card candidate-card';
            
            let actionHtml = '';
            if (currentUser && currentUser.role === 'admin') {
                actionHtml = `
                    <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 1rem;">
                        <button class="btn btn-edit" data-id="${cand._id}" data-name="${cand.name}" data-party="${cand.party}" data-age="${cand.age}" style="background: rgba(255,255,255,0.1); color: white; padding: 0.5rem 1rem;">Edit</button>
                        <button class="btn btn-delete" data-id="${cand._id}" style="background: var(--danger-color); color: white; padding: 0.5rem 1rem;">Delete</button>
                    </div>`;
            } else if (currentUser && currentUser.role === 'candidate') {
                actionHtml = `<p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 1rem;">Candidates cannot vote</p>`;
            } else if (currentUser && currentUser.isVoted) {
                actionHtml = `<p style="color: var(--success-color); font-size: 0.9rem; margin-top: 1rem;">Voting completed</p>`;
            } else {
                actionHtml = `<button class="btn btn-primary vote-btn" data-id="${cand._id}">Vote</button>`;
            }

            card.innerHTML = `
                <h3>${cand.name}</h3>
                <div class="candidate-party">${cand.party}</div>
                <div style="color: var(--text-secondary); font-size: 0.9rem;">Age: ${cand.age}</div>
                ${actionHtml}
            `;
            candidatesGrid.appendChild(card);
        });

        // Event listeners for generated buttons
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => await castVote(e.target.getAttribute('data-id')));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => await deleteCandidate(e.target.getAttribute('data-id')));
        });
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.getElementById('edit-cand-id').value = e.target.getAttribute('data-id');
                document.getElementById('edit-cand-name').value = e.target.getAttribute('data-name');
                document.getElementById('edit-cand-party').value = e.target.getAttribute('data-party');
                document.getElementById('edit-cand-age').value = e.target.getAttribute('data-age');
                editModal.classList.remove('hidden');
            });
        });
    };

    // Close edit modal
    document.getElementById('close-edit-modal').addEventListener('click', () => {
        editModal.classList.add('hidden');
    });

    // Cast Vote
    const castVote = async (candidateId) => {
        if (!confirm('Are you sure you want to vote for this candidate? This action cannot be undone.')) return;
        try {
            const res = await fetch(`/candidate/vote/${candidateId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                alert('Vote cast successfully!');
                await fetchProfile();
                await fetchCandidates();
            } else {
                alert(data.message || data.error || 'Failed to vote');
            }
        } catch (err) { alert('Network error while voting.'); }
    };

    // Delete Candidate
    const deleteCandidate = async (candidateId) => {
        if (!confirm('Delete this candidate?')) return;
        try {
            const res = await fetch(`/candidate/${candidateId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert('Deleted successfully');
                await fetchCandidates();
            }
        } catch (err) { alert('Network error'); }
    };

    // Edit Candidate Submit
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-cand-id').value;
        const name = document.getElementById('edit-cand-name').value;
        const party = document.getElementById('edit-cand-party').value;
        const age = document.getElementById('edit-cand-age').value;

        try {
            const res = await fetch(`/candidate/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name, party, age })
            });
            if (res.ok) {
                alert('Updated successfully');
                editModal.classList.add('hidden');
                await fetchCandidates();
            }
        } catch (err) { alert('Network error'); }
    });

    // Add Candidate
    addCandidateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('cand-name').value;
        const party = document.getElementById('cand-party').value;
        const age = document.getElementById('cand-age').value;
        const aadharCardNumber = document.getElementById('cand-aadhar').value;
        const password = document.getElementById('cand-password').value;

        try {
            const res = await fetch('/candidate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name, party, age, aadharCardNumber, password })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Candidate added successfully!');
                addCandidateForm.reset();
                await fetchCandidates();
            } else {
                adminError.textContent = data.message || data.error;
                adminError.style.display = 'block';
            }
        } catch (err) {
            adminError.textContent = 'Network error.';
            adminError.style.display = 'block';
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    });

    await fetchProfile();
    await fetchCandidates();
});
