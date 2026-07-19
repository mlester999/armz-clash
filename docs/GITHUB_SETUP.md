# GitHub repository setup — Armz Clash

## Repository

- Name: `armz-clash`
- Visibility: **private**
- Must not use the Atlas Game Studio remote

## Verify local Git root

```bash
cd "/Users/marklesteracak/Documents/Marky Files/Programming/armz-clash"
git rev-parse --show-toplevel
# must print: .../armz-clash
```

## Remote verification

```bash
git remote -v
# origin should contain armz-clash and must not contain atlas-game-studio
```

## Create remote (if missing)

GitHub CLI:

```bash
brew install gh   # if needed
gh auth login
cd "/Users/marklesteracak/Documents/Marky Files/Programming/armz-clash"
gh repo create armz-clash --private --source=. --remote=origin
git push -u origin master
```

Without GitHub CLI, create a private empty repository in the GitHub UI, then:

```bash
git remote add origin https://github.com/<owner>/armz-clash.git
git push -u origin master
```

## Branch note

This repository currently uses `master` as the default branch (matching `origin/master`).
Renaming to `main` is optional and should be coordinated with GitHub default-branch settings:

```bash
git branch -M main
git push -u origin main
# then set default branch in GitHub settings
```

## CI

Workflow: `.github/workflows/ci.yml`

- Quality job: format, lint, typecheck, unit tests, build, secret scan, static DB validation, client-bundle audit
- E2E job: Playwright foundation (depends on quality)
- No hosted Supabase writes
- Permissions: `contents: read`
