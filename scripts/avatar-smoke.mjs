const baseUrl = new URL(process.env.BASE_URL ?? 'http://127.0.0.1:3000');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchText(path) {
  const response = await fetch(new URL(path, baseUrl));
  const text = await response.text();
  return { response, text };
}

async function main() {
  const cases = [
    {
      name: 'missing src returns svg placeholder',
      path: '/api/avatar',
      expectInitials: 'AP',
    },
    {
      name: 'invalid external src returns svg placeholder with initials',
      path: '/api/avatar?src=https%3A%2F%2Fexample.com%2Favatar.png&initials=JB',
      expectInitials: 'JB',
    },
    {
      name: 'path traversal is rejected',
      path: '/api/avatar?src=%2F..%2Fsecret.png&initials=ZZ',
      expectInitials: 'ZZ',
    },
  ];

  for (const testCase of cases) {
    const { response, text } = await fetchText(testCase.path);
    assert(response.status === 200, `${testCase.name}: expected 200, got ${response.status}`);
    const contentType = response.headers.get('content-type') ?? '';
    assert(contentType.includes('image/svg+xml'), `${testCase.name}: expected SVG content-type, got ${contentType}`);
    assert(text.includes(testCase.expectInitials), `${testCase.name}: expected initials ${testCase.expectInitials} in fallback SVG`);
    console.log(`✓ ${testCase.name}`);
  }

  console.log(`All avatar smoke checks passed against ${baseUrl.origin}`);
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

