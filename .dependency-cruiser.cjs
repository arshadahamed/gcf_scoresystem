/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-no-infra',
      severity: 'error',
      comment: 'Domain must not import infrastructure',
      from: { path: 'packages/domain/src' },
      to:   { path: 'packages/infrastructure' },
    },
    {
      name: 'domain-no-contracts',
      severity: 'warn',
      comment: 'Domain should not depend on contracts (transport types)',
      from: { path: 'packages/domain/src' },
      to:   { path: 'packages/contracts/src' },
    },
    {
      name: 'application-no-infra',
      severity: 'error',
      comment: 'Application layer must not import infrastructure directly',
      from: { path: 'packages/application/src' },
      to:   { path: 'packages/infrastructure/src' },
    },
    {
      name: 'contracts-no-domain',
      severity: 'error',
      comment: 'Contracts must not import domain types (keep transport pure)',
      from: { path: 'packages/contracts/src' },
      to:   { path: 'packages/domain/src' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
