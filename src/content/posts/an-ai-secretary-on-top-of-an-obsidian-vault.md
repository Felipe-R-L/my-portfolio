---
title: An AI Secretary on Top of an Obsidian Vault
date: 2026-10-09
summary: >-
  Plain Markdown, a small VM at home and Claude Code running three times a day, and why the hard
  part was deciding what it is not allowed to do.
tags:
  - ai
  - claude-code
  - obsidian
  - homelab
draft: false
status: never-synced
synced_at: 2026-10-09T10:32:53.585Z
synced_hash: c0ad4cd14b507ef5b4a8b7d0169f63e04db7cc2ba9ef94a840f736682ba90dec
---

## 1. The Problem

Between a full time job, a freelance client, a small online store and a side product still looking for its first pilot, my week had more fronts than a to-do app could hold, and every app I tried asked for the same discipline it was supposed to replace: someone has to sit down, sort the captures, estimate the effort and move what was skipped yesterday into a slot that still exists today. That sorting is exactly the work that gets dropped first when the week gets busy, so the list grows, stops reflecting reality and is abandoned within a month.

The idea of this project was to keep capturing as cheap as possible on my side, a dictated sentence or a voice recording on the phone, and hand the sorting and planning to a model that reads the same notes I already keep in Obsidian, running on a server at home a few times a day.

## 2. The Architecture

The whole system revolves around a single folder of Markdown files inside my Obsidian vault, which is synced between the phone, the desktop and a small virtual machine on the Proxmox server I already run at home.

![[ai-secretary-architecture.svg]]

The phone only writes to two places: an iOS shortcut appends a dictated line to `Inbox.md`, and another one drops an audio file into a folder that Whisper transcribes on the CPU every fifteen minutes, since the only GPU in that server already belongs to another workload. Claude Code runs headless on the VM at 7am, 1pm and 6pm, reads the inbox, the task list, my routines and the goals I wrote down, and rewrites `Today.md` with time blocks that also land on a dedicated calendar with a ten minute alert, while a longer round on Sunday evening assembles the week. The same VM keeps a Remote Control session open, which means I can open the Claude app on the phone, ask what is left for today or say that a meeting just showed up, and it replans from the same files.

Every hour the vault is committed to a local Git repository and every night it is copied to Google Drive, which turned out to be less trivial than expected: the first backup took almost fifteen minutes for 3.4 MB, because Drive limits how many files can be created per second and a Git directory is mostly tiny objects, so the history now travels as a single `git bundle` and the whole backup takes about a minute.

The VM itself is provisioned with Terraform and configured with Ansible, using an API token whose role only exists on that one machine, its storage and its network bridge, so a mistake in the automation cannot reach anything else running on that host.

## 3. Plain Files Instead of an App

The decision that shaped everything else was keeping the state in plain Markdown instead of a database or a task manager with an API. The model reads exactly what I read, I can correct any of its decisions by editing a line on the phone, and the rules it follows live in a `CLAUDE.md` file next to the notes, written in the same language I would use to brief a human assistant on their first day.

It also made the permissions easy to reason about. The model reads the entire vault as context, including work notes and article drafts, but only writes inside the `Agenda/` folder, and since every change is committed hourly, anything it writes in the wrong place can be reverted with a single command.

## 4. Suggestions, Not Tasks

The first real round processed my inbox correctly and then added three tasks of its own taken from my email: a failed bank transfer, a forwarding confirmation I had already accepted and a job alert for the wrong role. None of them were wrong in isolation, but a task list that fills up with things I never asked for stops being mine, and I would end up ignoring it the same way I ignored every app before it.

The fix was a rule rather than code. Tasks now come only from me, either through the inbox or by approving a suggestion, and anything the model finds on its own goes to `Suggestions.md` with its source, where I check a box to accept it or delete the line to refuse it, which it then never suggests again. Suggestions left unanswered for seven days are removed.

## 5. Learning Without Growing Forever

The hourly snapshots have a side effect I only noticed later: they record when each checkbox in `Today.md` was ticked and which blocks were left unchecked, which is enough for the Sunday round to look for patterns in when I actually get things done, what keeps being postponed and which block sizes survive a real day. Those observations go into a `Learnings.md` file, each one with its evidence and date, and the daily rounds read it before placing anything.

The risk with that kind of memory is that it grows without bounds and every round pays to read it, so the file is capped at five items per section, and the weekly round merges similar entries, replaces them with newer evidence and drops anything that was not confirmed in six weeks. My own notes about goals and routines are never edited by the model, and when the data contradicts them it asks instead.

## 6. Measuring the Cost

The model runs on my personal subscription, which is the same quota I use for everything else, so the cost had to be measured rather than assumed. The first daily round ran on the largest model with no reading rules and used about 2.4 million tokens across 43 calls, most of them cached context being re-read as it opened file after file. With the daily rounds moved to a smaller model and a reading budget written into the rules, seven small files every time, any other note only when an item cites it by name and email only since the previous round, the same round took about 0.5 million tokens in 19 calls. The weekly review stays on the larger model, since it is the one that actually has to reason about a week of data.

## 7. Conclusion

The model was the easiest part of this project, it plans a day competently with nothing more than a folder of notes and a page of rules. What took the actual work was deciding what it is not allowed to do: where it can write, which calendar it can touch, what counts as my task and what is only its suggestion, how much it can read on each round and how much of what it learns is allowed to stay.

My opinion is that this is where personal assistants built on language models succeed or fail. The ability to read an inbox and draft a schedule is already a commodity, and what separates an assistant I keep using from one I abandon within a month is how faithfully those boundaries reflect the way I actually work.
