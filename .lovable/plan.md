# Job Collaboration for Post a Job

Let recruiters tick "Collaborate with colleagues" while posting a job and pick other verified recruiters from the **same institution**. Collaborators get full access to that job and its applications/interviews, exactly as if they had posted it themselves.

## UX

**PostJob page** — new section "Team & Collaboration":
- Checkbox: ☑ *Enable collaboration on this posting*
- When enabled, a searchable multi-select appears listing other recruiters whose verified `university` matches the current recruiter's locked institution. Each row shows avatar, name, designation.
- Helper text: "Selected teammates will be able to view applications, schedule interviews, and update statuses for this job."
- After submit, all selected recruiters are added as collaborators.

**Manage Jobs → My Jobs**:
- Jobs the recruiter owns *or* collaborates on appear in the same list.
- A small "Shared with N" / "Shared by <name>" badge identifies collaborative postings.
- Collaborators see the same Applications, Interviews, and candidate cards (no change to the unified `CandidateProfileCard`).

**Job detail / edit**: owner can add/remove collaborators later from the job's action menu. Collaborators can manage applications but cannot delete the job or remove other collaborators.

## Data model

New table `public.job_collaborators`:

```text
id              uuid pk
job_id          uuid  (the job)
recruiter_id    uuid  (collaborator)
added_by        uuid  (who invited them)
created_at      timestamptz
UNIQUE (job_id, recruiter_id)
```

RLS:
- Owner (`jobs.created_by`) can insert/delete rows for their jobs.
- Any party in the row can SELECT it.
- Collaborators get read/update access to the parent `jobs` row, its `job_applications`, and `interviews`, via new policies that check `EXISTS (SELECT 1 FROM job_collaborators WHERE job_id = … AND recruiter_id = auth.uid())`.
- A `SECURITY DEFINER` helper `is_job_collaborator(_job_id, _user_id)` keeps policy expressions simple and recursion-free.

The existing "same institution" rule is enforced **in the UI + a trigger**: on insert, the trigger verifies both recruiters share a non-null `profiles.university` (case-insensitive). Cross-institution invites are rejected.

## Code changes

1. **Migration** — create table, grants, RLS, trigger, helper function, plus additive policies on `jobs`, `job_applications`, `interviews` so collaborators inherit access.
2. **`src/pages/PostJob.tsx`** — add the Team & Collaboration card with checkbox + recruiter multi-select. On submit, after the `jobs` insert succeeds, bulk-insert into `job_collaborators`.
3. **`src/hooks/useRecruiterDashboard.ts`** — change the jobs fetch to include jobs where the user is a collaborator (single query via `or(`created_by.eq.${uid},id.in.(${collab_ids})`)` after fetching collaborator job IDs).
4. **`src/components/recruiter/dashboard/MyJobsTab.tsx`** — show "Shared with N" / "Shared by …" badge.
5. **New `JobCollaboratorsModal`** (lightweight) reachable from a job's "···" menu so the owner can add/remove collaborators after posting.

## Technical notes

- The institution match uses `lower(trim(university))` in both UI filter and trigger.
- Recruiter picker queries `profiles` filtered by `user_type='recruiter'`, matching university, excluding self and already-added collaborators. RLS already lets a recruiter view other recruiter profiles when they share rows (we'll add a narrow policy: recruiters may read minimal fields — `id, full_name, avatar_url, designation, university` — of other recruiters from the same `university`).
- No change to `CandidateProfileCard` or the Applications UI — collaborator access flows entirely through the new RLS policies, so the same components render for owners and collaborators.

Approve and I'll ship it.
