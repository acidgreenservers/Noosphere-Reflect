# Contributing to Noosphere Reflect 🧩

Thank you for your interest in contributing! This project thrives on community input for new platform scrapers, export formats, and UI improvements.

## 🚀 Development Workflow

### 1. Environment Setup
```bash
git clone https://github.com/acidgreenservers/Noosphere-Reflect.git
cd Noosphere-Reflect
npm install
```

### 2. Branching Policy
- `main`: Stable production branch.
- `dev`: Active development and integration.
- Feature branches: `feat/feature-name` or `fix/bug-name`.

### 3. Running Locally
```bash
npm run dev
```

## 🧪 Quality Standards

### Testing
We use **Vitest** for unit and integration tests.
```bash
npm test          # Run all tests
npm run test:ui   # Open Vitest UI for interactive testing
```
- New features should include relevant tests in `tests/`.
- Ensure `DatabaseIntegrity.test.ts` passes when modifying storage logic.

### Linting & Formatting
```bash
npm run lint      # Check for ESLint violations
npm run lint:fix  # Automatically fix linting issues
```
- We follow strict TypeScript rules to ensure code reliability.
- Suppress rules only when absolutely necessary and document why.

### Documentation
- Update `README.md` and `CHANGELOG.md` for any user-facing changes.
- If adding a new scraper, update `extension/README.md` and the scraper reference docs.

## 📮 Pull Request Process
1. Ensure all tests and linting pass locally.
2. Update the version number in `package.json` following semver.
3. Provide a clear description of the changes and screenshots if UI-related.
4. Request a review from the maintainers.

## 🎨 Coding Standards
- **Truth has one home**: Centralize state in the appropriate service or context.
- **Design for Failure**: Use Graceful fallbacks and error boundaries.
- **Security First**: Always sanitize user input and validate external data.

---

*“The most important part of the project is not the code — it is the thinking. Code reflects the thinking that wrote it.”*
