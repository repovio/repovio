import { version } from '../package.json';

export default defineAppConfig({
  version,
  ui: { colors: { primary: 'indigo', secondary: 'emerald', neutral: 'zinc' } },
  theme: { radius: '0.5rem', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' },
});
