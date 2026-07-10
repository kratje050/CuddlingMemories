export function mergeFaqs(databaseFaqs = [], fallbackFaqs = []) {
  const merged = [];
  const seenQuestions = new Set();

  [...databaseFaqs, ...fallbackFaqs].forEach((item, index) => {
    if (!item?.question) return;
    const key = item.question.trim().toLowerCase();
    if (seenQuestions.has(key)) return;
    seenQuestions.add(key);
    merged.push({
      ...item,
      sort_order: item.sort_order ?? index + 1,
    });
  });

  return merged.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
}
