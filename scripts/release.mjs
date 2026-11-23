#!/usr/bin/env node
// Publie une nouvelle version et la pousse sur GitHub.
//
//   npm run release            → correctif (2.1.0 → 2.1.1)
//   npm run release -- minor   → nouvelle fonctionnalité (2.1.1 → 2.2.0)
//   npm run release -- major   → changement qui casse l'existant (→ 3.0.0)
//   npm run release -- --dry-run   → montre ce qui serait fait, sans rien changer
//
// Étapes : vérifie qu'on est sur main, à jour et sans modification en cours ;
// incrémente la version (package.json + package-lock.json) ; transforme la
// section « [Non publié] » du CHANGELOG en « [X.Y.Z] - date » ; commite,
// pose le tag vX.Y.Z et pousse main avec le tag.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const level = args.find(a => !a.startsWith('--')) || 'patch'
const LEVELS = { patch: 2, correctif: 2, minor: 1, mineur: 1, major: 0, majeur: 0 }

function fail(msg) {
  console.error(`\n✖ ${msg}\n`)
  process.exit(1)
}
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim()
const run = (...a) => (dryRun ? console.log(`  (dry-run) git ${a.join(' ')}`) : execFileSync('git', a, { stdio: 'inherit' }))

if (!(level in LEVELS)) fail(`Niveau inconnu « ${level} » : patch, minor ou major.`)

// ── Vérifications ──────────────────────────────────────────────────────────
const branch = git('rev-parse', '--abbrev-ref', 'HEAD')
if (branch !== 'main') fail(`Les versions se publient depuis main (branche actuelle : ${branch}).`)
const dirty = git('status', '--porcelain', '--untracked-files=no')
if (dirty) fail(`Des modifications ne sont pas commitées :\n${dirty}`)
git('fetch', '--quiet', 'origin', 'main')
const behind = git('rev-list', '--count', 'HEAD..origin/main')
if (behind !== '0') fail(`main a ${behind} commit(s) de retard sur origin/main : faites d'abord « git pull --rebase ».`)

// ── Nouvelle version ───────────────────────────────────────────────────────
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const parts = pkg.version.split('.').map(Number)
if (parts.length !== 3 || parts.some(Number.isNaN)) fail(`Version actuelle illisible : ${pkg.version}`)
const i = LEVELS[level]
parts[i] += 1
for (let j = i + 1; j < 3; j++) parts[j] = 0
const version = parts.join('.')
const tag = `v${version}`
if (git('tag', '--list', tag)) fail(`Le tag ${tag} existe déjà.`)

// ── CHANGELOG ──────────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10)
let changelog = readFileSync('CHANGELOG.md', 'utf8')
const head = '## [Non publié]'
const at = changelog.indexOf(head)
if (at === -1) fail('Section « ## [Non publié] » introuvable dans CHANGELOG.md.')
const bodyStart = at + head.length
const next = changelog.indexOf('\n## [', bodyStart)
const body = changelog.slice(bodyStart, next === -1 ? undefined : next).trim()
  .replace(/\n{3,}/g, '\n\n')
  .replace(/^(- .*)\n\n(?=- )/gm, '$1\n') // pas de ligne vide au milieu d'une liste
const notes = body || '### Modifié\n- Maintenance.'
changelog = changelog.slice(0, at)
  + `${head}\n\n## [${version}] - ${today}\n\n${notes}\n`
  + (next === -1 ? '' : changelog.slice(next))

// ── Écriture, commit, tag, push ────────────────────────────────────────────
console.log(`\nVersion ${pkg.version} → ${version} (${level})\n\n${notes}\n`)
if (dryRun) {
  console.log('(dry-run) Rien n’a été modifié.')
  process.exit(0)
}

pkg.version = version
writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'))
lock.version = version
if (lock.packages?.['']) lock.packages[''].version = version
writeFileSync('package-lock.json', JSON.stringify(lock, null, 2) + '\n')
writeFileSync('CHANGELOG.md', changelog)

run('add', 'package.json', 'package-lock.json', 'CHANGELOG.md')
run('commit', '-m', `chore(release): ${tag}`)
run('tag', '-a', tag, '-m', `${tag}`)
run('push', 'origin', 'main', '--follow-tags')
console.log(`\n✔ ${tag} publiée et poussée.\n`)
