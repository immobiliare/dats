let isCi = false;

try {
    isCi = await import('is-ci').default;
} catch (_) {
    isCi = true;
}

if (!isCi) {
    const { default: husky } = await import('husky');
    husky();
    console.log('husky install');
}
