const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/\S+$/i;

/** Returns { 'path.to.field': 'message' } for everything that needs fixing before saving. */
export function validate(c) {
  const errors = {};
  if (!c.name?.trim()) errors['profile.name'] = 'Your name is required.';
  if (c.email && !EMAIL.test(c.email.trim())) errors['profile.email'] = 'This doesn’t look like an email address.';
  for (const key of ['github', 'linkedin', 'siteUrl']) {
    if (c[key] && !URL_RE.test(c[key].trim())) errors[`profile.${key}`] = 'Links must start with https://';
  }
  c.skills.forEach((g, i) => {
    if (!g.category.trim()) errors[`skills.${i}.category`] = 'Give this category a name.';
  });
  c.projects.forEach((p, i) => {
    if (!p.title.trim()) errors[`projects.${i}.title`] = 'Every project needs a title.';
    for (const key of ['repo', 'demo']) {
      if (p[key] && !URL_RE.test(p[key].trim())) errors[`projects.${i}.${key}`] = 'Links must start with https://';
    }
  });
  c.education.forEach((e, i) => {
    if (!e.degree.trim()) errors[`education.${i}.degree`] = 'Add a degree or title.';
  });
  return errors;
}

export function errorsForTab(errors, tab) {
  return Object.keys(errors).filter((k) => k.startsWith(`${tab}.`)).length;
}
