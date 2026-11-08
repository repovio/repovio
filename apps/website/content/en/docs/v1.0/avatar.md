---
title: 'Avatar'
description: 'Upload, import, crop, or remove your profile picture.'
---

> Archived source snapshot. Product labels use Repovio. Use the configuration identifiers and container references from
> this release's tagged deployment files unchanged.

<a id="choose-an-image"></a>

## Choose an image

Every signed-in user, including OIDC users, can open **Settings → General** and upload a JPEG, PNG, or WebP up to 2 MiB.
Alternatively import an image from a public HTTPS URL. A non-square image opens the crop dialog; choose the square crop
and confirm before upload. Canceling the dialog leaves the current avatar unchanged.

Repovio strips image metadata, renders a 256 × 256 WebP, and stores only that normalized image in PostgreSQL. It does
not retain the original image or remote URL. Invalid type, oversized image, import failure, decode failure, and upload
failure are reported separately; choose a supported image or retry after fixing the source/connectivity.

<a id="remove-and-display"></a>

## Remove and display

Use the remove action to delete the current picture. A failed removal leaves the existing avatar available for retry.
Without a picture, the interface displays initials based on personal name or username. Repository member avatar groups
show at most five members and summarize additional members. Avatar visibility follows the containing resource's
permissions. Changing a Repovio avatar does not update your provider profile picture.
