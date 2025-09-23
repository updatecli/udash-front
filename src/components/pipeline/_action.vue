<template>
    <v-toolbar
        density="compact"
        class="text-white"
    >
        <v-toolbar-title>
            <v-icon
                :icon="getActionIcon()"
                :color="getActionColor()"
            ></v-icon>  {{ data.title }}
        </v-toolbar-title>

        <v-toolbar-items>
            <v-btn>{{ id }}</v-btn>
        </v-toolbar-items>
    </v-toolbar>

    <v-container fluid>
        <v-row class="mb-4">
            <v-col cols="12">
                <v-card flat class="pa-3">
                    <v-table class="metadata-table">
                        <thead>
                            <tr class="bg-grey-lighten-4">
                                <th class="font-weight-bold" style="width:25%;">ID</th>
                                <th class="font-weight-bold" style="width:25%;">Type</th>
                                <th class="font-weight-bold" style="width:25%;">Platform</th>
                                <th class="font-weight-bold" style="width:25%;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="font-weight-medium">{{ id }}</td>
                                <td>
                                    <v-chip
                                        size="small"
                                        variant="flat"
                                        class="text-white"
                                    >
                                        <v-icon size="x-small" class="mr-1">
                                            {{ getActionIcon() }}
                                        </v-icon>
                                        {{ getActionType() }}
                                    </v-chip>
                                </td>
                                <td>
                                    <v-chip variant="outlined" size="small" :color="getPlatformColor()">
                                        <v-icon size="x-small" class="mr-1">
                                            {{ getPlatformIcon() }}
                                        </v-icon>
                                        {{ getPlatformName() }}
                                    </v-chip>
                                </td>
                                <td>
                                    <v-btn
                                        :href="data.actionUrl"
                                        target="_blank"
                                        size="small"
                                        variant="outlined"
                                        :prepend-icon="getActionIcon()"
                                    >
                                        {{ getActionButtonText() }}
                                    </v-btn>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
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

        getPlatformColor() {
            if (!this.gitInfo) return 'grey';

            const platformColors = {
                'github': 'grey-darken-2',
                'gitlab': 'orange',
                'bitbucket': 'blue',
                'gitea': 'green'
            };

            return platformColors[this.gitInfo.provider] || 'primary';
        },

        getActionType() {
            if (!this.gitInfo) return 'Action';

            // GitLab uses merge requests
            if (this.gitInfo.provider === 'gitlab') {
                return 'Merge Request';
            }

            // All others use pull requests
            return 'Pull Request';
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

        getActionColor() {
            return this.getPlatformColor();
        }
    }
}
</script>

<style scoped>
.metadata-table {
    font-size: 1rem;
}

.metadata-table th {
    font-size: 1.1rem;
    font-weight: 600;
    padding: 12px 16px;
    background-color: rgba(0, 0, 0, 0.02);
}

.metadata-table td {
    font-size: 1rem;
    padding: 12px 16px;
    font-weight: 500;
}
</style>
