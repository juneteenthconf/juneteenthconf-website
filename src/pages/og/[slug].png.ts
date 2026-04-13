import type { APIRoute, GetStaticPaths } from 'astro';
import satori from 'satori';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

async function fetchGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  const css = await fetch(cssUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; curl/7.0)' },
  }).then(r => r.text());
  const urlMatch = css.match(/src: url\(([^)]+\.(?:ttf|otf))\)/);
  if (!urlMatch) throw new Error(`No TTF URL found for ${family}`);
  const fontRes = await fetch(urlMatch[1]);
  return fontRes.arrayBuffer();
}

let _fonts: { name: string; data: ArrayBuffer; weight: number; style: 'normal' }[] | null = null;
async function getFonts() {
  if (_fonts) return _fonts;
  const [sg, inter] = await Promise.all([
    fetchGoogleFont('Space Grotesk', 700),
    fetchGoogleFont('Inter', 400),
  ]);
  _fonts = [
    { name: 'Space Grotesk', data: sg, weight: 700, style: 'normal' as const },
    { name: 'Inter', data: inter, weight: 400, style: 'normal' as const },
  ];
  return _fonts;
}

const CARDS = [
  { slug: 'default',    title: 'Building Our Own Table',   sub: 'June 19–20, 2026  ·  Chicago, IL' },
  { slug: 'conference', title: 'Conference 2026',           sub: 'June 19–20, 2026  ·  Chicago, IL' },
  { slug: 'speakers',   title: 'Speakers',                  sub: 'Keynote: Madison Butler' },
  { slug: 'register',   title: 'Register Now',              sub: 'Juneteenth Conference 2026  ·  Chicago' },
  { slug: 'volunteer',  title: 'Volunteer',                 sub: 'Join the team. Build the table.' },
  { slug: 'sponsor',    title: 'Become a Sponsor',          sub: 'Support Black excellence in tech.' },
  { slug: 'about',      title: 'About JuneteenthConf',      sub: 'Building Our Own Table since 2020.' },
  { slug: 'juneteenth', title: 'What is Juneteenth?',       sub: 'The history. The meaning. The mission.' },
  { slug: 'schedule',   title: 'Schedule',                  sub: 'June 19–20, 2026  ·  Chicago, IL' },
];

export const getStaticPaths: GetStaticPaths = () =>
  CARDS.map(({ slug, title, sub }) => ({ params: { slug }, props: { title, sub } }));

export const GET: APIRoute = async ({ props }) => {
  const { title, sub } = props as { title: string; sub: string };

  const fonts = await getFonts();

  const logoBuffer = await readFile(resolve('./public/logo-white.png'));
  const logoDataUri = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  const node = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column' as const,
        width: '1200px',
        height: '630px',
        background: '#231c2d',
        padding: '0',
        position: 'relative' as const,
        overflow: 'hidden',
      },
      children: [
        // Red top accent bar
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute' as const,
              top: 0, left: 0, right: 0,
              height: '6px',
              background: '#c84342',
            },
          },
        },
        // Gold bottom accent
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute' as const,
              bottom: 0, left: 0, right: 0,
              height: '3px',
              background: 'rgba(212,168,67,0.4)',
            },
          },
        },
        // Left content column
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'space-between',
              padding: '64px 72px',
              flex: 1,
            },
            children: [
              // Logo
              {
                type: 'img',
                props: {
                  src: logoDataUri,
                  style: { height: '40px', width: 'auto' },
                },
              },
              // Text block
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontFamily: 'Space Grotesk',
                          fontWeight: 700,
                          fontSize: title.length > 22 ? '52px' : '64px',
                          color: '#D4A843',
                          lineHeight: 1.05,
                          letterSpacing: '-1px',
                        },
                        children: title,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontFamily: 'Inter',
                          fontWeight: 400,
                          fontSize: '26px',
                          color: 'rgba(240,237,230,0.55)',
                          letterSpacing: '0.2px',
                        },
                        children: sub,
                      },
                    },
                  ],
                },
              },
              // Footer tag
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Inter',
                    fontSize: '14px',
                    letterSpacing: '3px',
                    textTransform: 'uppercase' as const,
                    color: 'rgba(240,237,230,0.25)',
                  },
                  children: 'juneteenthconf.com',
                },
              },
            ],
          },
        },
      ],
    },
  };

  const svg = await satori(node as any, {
    width: 1200,
    height: 630,
    fonts,
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  });
};
