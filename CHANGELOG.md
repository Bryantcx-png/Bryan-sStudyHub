# Changelog

## 2026-06-14

- Removed the background photo entirely; the top bar is now dark navy with white text for better contrast.
- The quiz question view stays locked to the screen (no page scrolling), while the "review wrong answers" view scrolls normally and the header moves with the page.
- Added type-in questions for Lab Test 1: name the sorting algorithm shown in an animation, and fill in the worst-case time complexity O(__) for each of the six sorting algorithms.
- Lab Test 1 sorting questions now cover only Bubble, Selection, Insertion, Merge, Quick, and Heap Sort (Shell Sort and Bogosort questions removed, as they aren't covered in lectures).
- Quiz pages no longer scroll the whole page while answering a question — the question card scrolls internally instead, locking the layout to the viewport.
- Fixed a white bar appearing at the bottom of the page on iOS Safari by using dynamic viewport height for the background image.
- Reorganized image assets (`background-desktop.jpg`, `background-mobile.jpg`, `web_icon.png`, `mingze_good.png`, `lizard-lizard-lizard.gif`) into a new `assets/` folder and removed unused large source images.
