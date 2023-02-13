const { readdirSync } = require('fs');

const files = readdirSync('.out');

const assets = files.map((f) => {
    const [, , distro] = f.split('-');
    return {
        path: `.out/${f}`,
        label: `${distro} distribution`,
    };
});

module.exports = {
    branches: [
        { name: 'main' },
        { name: 'next', channel: 'next', prerelease: true },
    ],
    plugins: [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        '@semantic-release/changelog',
        '@semantic-release/npm',
        [
            '@semantic-release/git',
            {
                assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
            },
        ],
        [
            '@semantic-release/github',
            {
                assets,
            },
        ],
        [
            '@saithodev/semantic-release-backmerge',
            {
                branches: [{ from: 'main', to: 'next' }],
                clearWorkspace: true,
            },
        ],
    ],
};
