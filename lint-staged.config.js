module.exports = {
    '*.{js,css,json,md,yaml,yml}': ['prettier --write'],
    '*.md': (filenames) =>
        filenames.map((filename) => `'markdown-toc -i ${filename}`),
    '*.ts': ['npm run style:lint', 'npm run style:prettier'],
    '*.ts': () => 'tsc -p tsconfig.json --noEmit',
};
