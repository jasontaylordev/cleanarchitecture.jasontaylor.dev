import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://cleanarchitecture.jasontaylor.dev',
  integrations: [
    starlight({
      title: 'Clean Architecture Solution Template',
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
      },
customCss: ['./src/styles/starlight.css'],
      favicon: '/favicon.png',
      logo: {
        src: './public/logo.svg',
      },
      components: {
        SiteTitle: './src/components/docs/SiteTitle.astro',
        SocialIcons: './src/components/docs/SocialIcons.astro',
      },
      sidebar: [
        {
          label: 'Getting started',
          items: [
            { label: 'Overview', slug: 'docs/getting-started' },
            { label: 'Installation', slug: 'docs/getting-started/installation' },
            { label: 'Your first project', slug: 'docs/getting-started/first-project' },
            { label: 'Code scaffolding', slug: 'docs/getting-started/code-scaffolding' },
            { label: 'Deployment', slug: 'docs/getting-started/deployment' },
          ],
        },
        {
          label: 'Architecture',
          items: [
            { label: 'Overview', slug: 'docs/architecture' },
            { label: 'Domain layer', slug: 'docs/architecture/domain-layer' },
            { label: 'Application layer', slug: 'docs/architecture/application-layer' },
            { label: 'Infrastructure layer', slug: 'docs/architecture/infrastructure-layer' },
            { label: 'Presentation layer', slug: 'docs/architecture/presentation-layer' },
          ],
        },
        {
          label: 'Features',
          items: [
            { label: 'Multiple UI options', slug: 'docs/features/multiple-ui-options' },
            { label: 'Multiple database options', slug: 'docs/features/multiple-database-options' },
            { label: 'Structured use cases', slug: 'docs/features/structured-use-cases' },
            { label: 'Behaviours, not boilerplate', slug: 'docs/features/pipeline-behaviours' },
            { label: 'Automated tests', slug: 'docs/features/automated-tests' },
            { label: 'OpenAPI & generated clients', slug: 'docs/features/openapi-generated-clients' },
            { label: 'Aspire orchestration', slug: 'docs/features/aspire' },
          ],
        },
      ],
    }),
  ],
});
