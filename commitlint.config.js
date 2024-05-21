module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'body-max-length': [0, 'always'],
        'body-max-line-length': [0, 'always'],
        'footer-max-length': [0, 'always'],
        'footer-max-line-length': [0, 'always'],
        'header-max-length': [0, 'always'],
        'scope-max-length': [0, 'always'],
        'subject-max-length': [0, 'always'],
        'type-max-length': [0, 'always'],
    },
};
