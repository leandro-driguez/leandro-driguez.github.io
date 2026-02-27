---
layout: post
title: "Adding HTTP response headers to a Netlify static website"
date: 2021-03-25
slug: adding-http-response-headers-to-a-netlify-static-website
tags: ["Jekyll", "Website"]
excerpt: "Eros vel condimentum elementum, ipsum ex ultricies neque, et consequat risus neque quis felis. Praesent ut lectus hendrerit sem eleifend cursus. Nunc eget pulvinar nisi. Duis vel orci nec mauris lacinia rutrum."
notion_id: "30686d15-3727-81e5-bcfc-ea5c70d32c54"
---

Lorem ipsum dolor amet tousled viral art party blue bottle single-origin coffee cardigan, selvage man braid helvetica. Banh mi taxidermy meditation microdosing. Selvage cornhole YOLO, small batch vexillologist raclette VHS prism sustainable 8-bit ugh semiotics letterpress disrupt pop-up. Celiac shabby chic ugh, jianbing whatever kitsch tattooed edison bulb kogi irony etsy.

## Important Stuff

Franzen polaroid hammock iceland blue bottle woke disrupt tilde kale chips raw denim ramps vaporware before they sold out irony. Narwhal vaporware offal shaman celiac kinfolk activated charcoal salvia lomo irony readymade normcore. Yr activated charcoal kombucha, man braid whatever biodiesel hella crucifix adaptogen bicycle rights small batch skateboard mixtape. Hot chicken sustainable green juice 90’s. Ennui kickstarter hella pug, meggings man bun shaman messenger bag. Chambray adaptogen kombucha pug affogato, kogi green juice distillery ugh banh mi.

## Code Block

```javascript
const BLOG = {
  title: 'CRAIGARY',
  author: 'Craig Hart',
  email: 'i@craigary.net',
  link: 'https://nobelium.vercel.app',
  description: 'This gonna be an awesome website.',
  lang: 'en-US',
  appearance: 'auto', // ['light', 'dark', 'auto'],
  lightBackground: '#ffffff', // use hex value, don't forget '#' e.g #fffefc
  darkBackground: '#111827', // use hex value, don't forget '#'
  path: '', // leave this empty unless you want to deploy Nobelium in a folder
  since: 2021, // if leave this empty, current year will be used.
  postsPerPage: 7,
  showAbout: true, // WIP
  showArchive: true, // WIP
  socialLink: 'https://twitter.com/craigaryhart',
  seo: {
    keywords: ['Blog', 'Website', 'Notion'],
    googleSiteVerification: '' // Remove the value or replace it with your own google site verification code
  },
  notionPageId: process.env.NOTION_PAGE_ID, // DO NOT CHANGE THIS！！！
}
// export default BLOG
module.exports = BLOG
```

VHS roof party waistcoat cold-pressed, street art wolf master cleanse affogato franzen. Shaman iceland pour-over intelligentsia typewriter tilde, pitchfork copper mug. Wayfarers kickstarter adaptogen vinyl beard kombucha. Organic pinterest master cleanse, mixtape fam gentrify lo-fi kogi.

## Latex

E=mc^2

Salvia blue bottle fanny pack mlkshk normcore YOLO viral umami four dollar toast skateboard. Chambray taxidermy slow-carb street art chartreuse. Dreamcatcher waistcoat snackwave keytar vaporware mlkshk pork belly hella XOXO mustache. Tattooed semiotics edison bulb, disrupt polaroid craft beer vape enamel pin bespoke flannel letterpress brooklyn subway tile copper mug. Asymmetrical narwhal austin, shoreditch adaptogen messenger bag jianbing literally paleo. Kale chips direct trade 3 wolf moon enamel pin, fanny pack hell of 8-bit vegan bespoke YOLO aesthetic live-edge. Retro succulents before they sold out whatever bushwick.

Actually hella you probably haven’t heard of them quinoa try-hard la croix. Street art schlitz actually hell of pour-over air plant. Post-ironic franzen brunch mumblecore readymade. Food truck photo booth polaroid, gochujang vegan street art yr before they sold out man bun. Tilde selfies chia pitchfork everyday carry post-ironic mumblecore sartorial VHS master cleanse activated charcoal biodiesel williamsburg cronut jean shorts. Poutine helvetica keffiyeh butcher pop-up.
