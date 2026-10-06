# Building the master template

> This page is about making the template **clean** — no OX Glass data, no
> secrets. Making it **presentable** is a separate job with its own page:
> `ESTANDAR-DE-LA-PLANTILLA.md`, which also closes a real hole: a fresh
> installation ships without the plain-text column format that stops a PO like
> `07-6329` turning into a date.

The one file every customer copies. Get this wrong and each of them receives OX
Glass's inventory, and OX Glass's email sitting in their user list as an admin
of *their* system.

## Why this is not just "delete the rows"

Copying a Sheet copies the **sheet data** — movements, users, catalogs,
everything. It does **not** copy Script Properties, which is why company name and
setup state reset on a copy while the rows do not. That asymmetry is the whole
trap: the copy *looks* fresh (it asks for setup) while still holding the
previous company's data.

Cached Drive folder IDs matter too. They live in Script Properties, so they
don't copy — but if any survived they would point at folders in the master
owner's Drive that the customer cannot reach.

## Steps

1. **Copy the working spreadsheet.** Never do the rest on the live one.
   File → Make a copy. Name it something obviously not production.

2. **In the copy:** `🏭 Acopio → 🔧 Advanced → 💣 Erase everything`.
   It shows the file name and asks you to type `ERASE`. Read the file name in
   that prompt before typing — it is the last thing standing between you and
   wiping production.

   Clears all data sheets (headers kept), all CONFIG catalogs, every
   identity/secret Script Property, every cached folder ID, and every trigger.

3. **Verify:** `🔧 Advanced → 🔎 Check if this copy is a clean template`.
   It re-reads the file and lists anything a customer would receive. "The wipe
   reported success" and "the file is clean" are different claims; only the
   second one counts.

4. **Rename the Apps Script project** — Extensions → Apps Script, click the name
   top-left. This is what customers see on Google's permission screen, and code
   cannot set it (see docs/BACKLOG.md, hidden default Cloud project).

5. **Paste the current code**, if the copy is behind: `Code.gs`, `Index.html`,
   `SetupWizard.html`, `appsscript.json`. Check `APP_VERSION` matches in both
   Code.gs and Index.html.

6. **Share:** Anyone with the link → **Viewer**. Viewer, not Editor — an Editor
   could change the template every future customer copies.

7. **Hand out the /copy link:** take the file URL and replace `/edit...` with
   `/copy`.

8. **Copy it yourself once and run the wizard end to end.** This is the only way
   to see what a customer actually sees, and the only way to check what the
   publish step reports on a genuinely fresh copy — the open question behind the
   dead-link problem in v9.10.

## Re-check before every release

Anything that adds a sheet has to be added to `TEMPLATE_DATA_SHEETS`, and
anything that adds an identity/secret property to `TEMPLATE_WIPE_PROPS` (both in
Code.gs). They are explicit lists rather than "clear everything unknown" so a
mistake is visible in a diff — but that only helps if the lists are updated.
