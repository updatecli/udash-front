import { describe, expect, it } from 'vitest'
import { extractGitURLInfo } from '@/composables/git'

describe('extractGitURLInfo', () => {
  it.each([
    ['https://github.com/updatecli/updatecli', 'github'],
    ['https://GitLab.com/group/project/-/merge_requests/1', 'gitlab'],
    ['https://gitea.com/owner/repo', 'gitea'],
    ['https://bitbucket.org/owner/repo', 'bitbucket'],
  ])('reads %s', (url, provider) => {
    const info = extractGitURLInfo(url)
    expect(info.provider).toBe(provider)
    expect(info.rawURL).toBe(url)
  })

  it('reads the owner and repository, including from an SSH URL', () => {
    expect(extractGitURLInfo('git@github.com:updatecli/udash-front')).toMatchObject({
      provider: 'github',
      owner: 'updatecli',
      repo: 'udash-front',
    })
  })

  it('reads a pull request URL', () => {
    expect(extractGitURLInfo('https://github.com/updatecli/udash/pull/12')).toMatchObject({
      owner: 'updatecli',
      repo: 'udash',
    })
  })

  it.each([
    'https://github.com/updatecli/udash.git',
    'git@github.com:updatecli/udash.git',
    'https://github.com/updatecli/udash.git/',
  ])('leaves .git out of the repository name of %s', (url) => {
    expect(extractGitURLInfo(url)).toMatchObject({ owner: 'updatecli', repo: 'udash' })
  })

  it('keeps a name that only contains .git', () => {
    expect(extractGitURLInfo('https://github.com/owner/site.github.io').repo).toBe('site.github.io')
  })

  it('returns null for something other than a string', () => {
    expect(extractGitURLInfo(undefined)).toBeNull()
    expect(extractGitURLInfo(null)).toBeNull()
  })

  it('returns null for a host it does not know', () => {
    expect(extractGitURLInfo('https://git.example.com/owner/repo')).toBeNull()
  })
})
