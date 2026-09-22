<template>
    <div class="stage-header">
        <v-icon aria-hidden="true" class="stage-header__icon" :icon="getActionIcon()"></v-icon>
        <h2 class="stage-header__name text-title-large">{{ data.title }}</h2>
        <span class="resource-id text-body-medium text-medium-emphasis">{{ id }}</span>
    </div>

    <v-container fluid class="px-0 px-sm-4">
        <v-row class="mb-4">
            <v-col cols="12">
                <v-card flat class="pa-3">
                    <dl class="meta-grid">
                    <div>
                        <dt>Type</dt>
                        <dd>
                            <v-chip
                                size="small"
                                variant="flat"
                            >
                                <v-icon size="x-small" class="mr-1">
                                    {{ getActionIcon() }}
                                </v-icon>
                                {{ getActionType() }}
                            </v-chip>
                        </dd>
                    </div>
                    <div>
                        <dt>Platform</dt>
                        <dd>
                            <v-chip
                                size="small"
                                variant="outlined"
                                >
                                <v-icon size="x-small" class="mr-1">
                                    {{ getPlatformIcon() }}
                                </v-icon>
                                {{ getPlatformName() }}
                            </v-chip>
                        </dd>
                    </div>
                    <div>
                        <dt>Action</dt>
                        <dd>
                            <v-btn
                                :href="data.actionUrl"
                                target="_blank"
                                size="small"
                                variant="outlined"
                                :prepend-icon="getActionIcon()"
                            >
                                {{ getActionButtonText() }}
                            </v-btn>
                        </dd>
                    </div>
                    </dl>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import { extractGitURLInfo } from '@/composables/git';

export default {
    name: "ActionComponent",

    data: () => ({
    }),

    props: [
        'data',
        'id'
    ],

    computed: {
        gitInfo() {
            return extractGitURLInfo(this.data.actionUrl);
        }
    },

    methods: {
        getPlatformName() {
            if (!this.gitInfo) return 'Unknown';

            const platformNames = {
                'github': 'GitHub',
                'gitlab': 'GitLab',
                'bitbucket': 'Bitbucket',
                'gitea': 'Gitea'
            };

            return platformNames[this.gitInfo.provider] || 'Git';
        },

        getPlatformIcon() {
            if (!this.gitInfo) return 'mdi-git';

            const platformIcons = {
                'github': 'mdi-github',
                'gitlab': 'mdi-gitlab',
                'bitbucket': 'mdi-bitbucket',
                'gitea': 'mdi-git'
            };

            return platformIcons[this.gitInfo.provider] || 'mdi-git';
        },


        getActionType() {
            if (!this.gitInfo) return 'Action';

            // GitLab uses merge requests
            if (this.gitInfo.provider === 'gitlab') {
                return 'Merge request';
            }

            // All others use pull requests
            return 'Pull request';
        },

        getActionIcon() {
            if (!this.gitInfo) return 'mdi-source-branch';

            // GitLab merge request
            if (this.gitInfo.provider === 'gitlab') {
                return 'mdi-source-merge';
            }

            // Pull request for other platforms
            return 'mdi-source-pull';
        },

        getActionButtonText() {
            if (!this.gitInfo) return 'Review';

            // GitLab merge request
            if (this.gitInfo.provider === 'gitlab') {
                return 'Review MR';
            }

            // Pull request
            return 'Review PR';
        },

    }
}
</script>
<style scoped>
.stage-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 12px;
    padding: 12px 16px;
    background: rgb(var(--v-theme-surface));
}

.stage-header__name {
    flex: 1 1 16rem;
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
}

.resource-id {
    font-family: var(--udash-font-mono);
    overflow-wrap: anywhere;
}
</style>
