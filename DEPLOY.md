# Hosting on GitHub Pages

The repo is committed and ready. Four steps, all in the browser except the push.

---

## 1. Create the repo on GitHub

**https://github.com/new**

- Name: `class-of-27`
- **Public** (GitHub Pages needs a paid plan for private repos)
- Do **not** tick "Add a README" — this repo already has one

---

## 2. Push

```bash
cd ~/class-of-27
git remote add origin git@github.com:YOUR-USERNAME/class-of-27.git
git push -u origin main
```

Replace `YOUR-USERNAME`. Your SSH key is already set up, so this should not
ask for a password.

---

## 3. Add the two Supabase values as repository secrets

The build needs them, and they are not in the repo.

**Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://vekwrbraxdulapbjugwl.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | the `anon` key from Supabase → Project Settings → API |

> The `anon` key ends up inside the public JavaScript bundle either way — that
> is by design, and the RLS policies are what protect the data. Using a secret
> here just keeps it out of the source.

---

## 4. Turn Pages on

**Settings → Pages → Build and deployment → Source: GitHub Actions**

That is it. Every push to `main` now rebuilds and republishes.

Your URL will be:

```
https://YOUR-USERNAME.github.io/class-of-27/
```

The first deploy takes ~2 minutes. Watch it under the **Actions** tab.

---

## If the build fails

The workflow deliberately fails rather than publishing a broken app if the
secrets are missing — you will see:

> No Supabase URL in the bundle. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
> as repository secrets.

Add them, then **Actions → the failed run → Re-run jobs**.

---

## Making changes later

```bash
cd ~/class-of-27
git add -A
git commit -m "what changed"
git push
```

The site rebuilds automatically.
