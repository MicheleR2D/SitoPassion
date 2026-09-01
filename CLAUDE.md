## Pagine del sito (design system)

Prima di creare o modificare una pagina in `src/content/pages/`, leggere
**[docs/TEMPLATE-PAGINA.md](docs/TEMPLATE-PAGINA.md)**: contiene lo scheletro
standard, l'API dei componenti, i valori esatti di colori/font/spaziature e le
regole architetturali da non violare. La pagina modello di riferimento è
`src/content/pages/palestra/sala-pesi.mdx`.

Le pagine si compongono assemblando i componenti di `src/components/ui/` e
passando dati: non si scrive CSS nei file `.mdx`.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
