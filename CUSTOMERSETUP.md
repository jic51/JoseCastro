# Setting up your warehouse system

About 10 minutes, once. You do not need to install anything, and you do not need
to be technical — but there is one screen partway through that looks alarming and
isn't. It's explained below, in step 4.

Everything lives in **your own** Google account. Nobody else can see your
inventory, including us.

---

## 1. Make your copy

Open the link you were sent. It ends in `/copy`.

Google asks where to save it. Click **Make a copy**.

> You'll see a note that "functions and the Apps Script file will also be
> copied". That's the system itself — it has to come along. Nothing to change.

The copy is now yours. It lives in your Google Drive.

## 2. Let it start

The setup window opens by itself. If it doesn't, use the menu at the top:
**🏭 Acopio → 🚀 Set Up Acopio**.

Fill in your company name, what you store, where you store it, and who works
there. Take your time — all of it can be changed later from inside the app.

## 3. Publish it

The last step gives you numbered instructions for turning your copy into a web
address your team can open. Follow them exactly.

**One thing the instructions ask for, that people miss:** when Google shows you
the **Web app URL** ending in `/exec`, **copy it before closing that box**. Paste
it where the setup window asks. That address is your system — bookmark it and
share it with your team.

## 4. The scary-looking screen (this is normal)

Partway through publishing, Google shows:

> ⚠️ **Google hasn't verified this app**
> The app is requesting access to sensitive info in your Google Account.

**This is expected, and it is not a warning about us.**

Here's what's actually happening. You just made your own private copy of the
system. That copy is software running under *your* account, authorized by *you* —
so Google shows you the same caution it shows any developer running their own
code for the first time. The email shown as "the developer" is **your own**.

Google reserves the verified badge for apps published centrally to millions of
users. Your copy is not that — it's yours alone, which is exactly the point: your
inventory never passes through anyone else's servers.

**To continue:** click **Advanced**, then **Go to (your project name)**.

You may also see a note about a missing Privacy Policy link. Same reason — a
private copy has no public listing to point at.

## 5. What it asks permission for, and why

| Permission | What it's for |
|---|---|
| See and manage spreadsheets | Reading and writing your own inventory sheet |
| See and manage Drive files | Storing invoices and photos you attach, and the nightly backup |
| Send email as you | Delivery notices to your project managers, and alerts to you |
| Connect to an external service | Reading document text when you use AI Extract |

It never sees anything outside its own folder, and nothing leaves your Google
account.

## 6. Done

Open the link you saved. Bookmark it. Share it with your team — anyone you added
to the user list can sign in with their Google account.

**Turn on the nightly backup** from the spreadsheet menu:
**🏭 Acopio → 🗄 Backup Now / Enable Daily Backup**. It runs at 2am and keeps a
dated copy for 30 days. The app tells you each time one is made.

---

## If something goes wrong

**"Sorry, unable to open the file at this time"** on the copy link — check the
address has no extra character (a stray period at the end is the usual cause).

**The link from setup doesn't open** — Google sometimes reports the wrong address
here. Go back to the Apps Script editor, **Deploy → Manage deployments**, copy
the URL shown there, and paste it into the setup window using **"Paste the
correct link"**.

**Someone can't get in** — they must be on the user list (Settings → Directory),
and signed in with the Google account that matches the email on that list.
