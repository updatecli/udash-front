import { describe, expect, it } from 'vitest'
import GitRepositorySection from '@/components/pipeline/configs/GitRepositorySection.vue'

const { getRepositoryDisplayName, getGitProviderIcon } = GitRepositorySection.methods

describe('GitRepositorySection', () => {
  it('names a known repository owner/repo, without .git', () => {
    expect(getRepositoryDisplayName('https://github.com/updatecli/udash.git')).toBe('updatecli/udash')
  })

  it('shows the URL itself for a host it does not know', () => {
    expect(getRepositoryDisplayName('https://git.example.com/team/repo.git')).toBe('https://git.example.com/team/repo.git')
  })

  it('picks the provider icon, falling back to the generic one', () => {
    expect(getGitProviderIcon('https://gitlab.com/group/project')).toBe('mdi-gitlab')
    expect(getGitProviderIcon('https://git.example.com/team/repo')).toBe('mdi-git')
  })
})
