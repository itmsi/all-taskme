# 🤝 Contributing to TaskMe

Terima kasih atas minat Anda untuk berkontribusi pada TaskMe! Dokumen ini akan membantu Anda memahami cara berkontribusi dengan efektif.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## 📜 Code of Conduct

Dengan berpartisipasi dalam proyek ini, Anda setuju untuk menghormati kode etik kami. Harap bersikap sopan, inklusif, dan konstruktif dalam semua interaksi.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 atau lebih baru)
- Docker & Docker Compose
- Git
- PostgreSQL (opsional untuk development)

### Setup Development Environment

1. **Fork dan clone repository**
```bash
git clone https://github.com/your-username/taskme.git
cd taskme
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Setup environment files**
```bash
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env
```

4. **Start development environment**
```bash
./dev.sh
```

## 🔄 Development Workflow

### Branch Strategy

- `main` - Branch utama untuk production
- `develop` - Branch untuk development
- `feature/feature-name` - Branch untuk fitur baru
- `bugfix/bug-name` - Branch untuk bug fixes
- `hotfix/hotfix-name` - Branch untuk hotfixes

### Workflow Steps

1. **Create feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes and commit**
```bash
git add .
git commit -m "feat: add new feature description"
```

3. **Push and create PR**
```bash
git push origin feature/your-feature-name
```

## 📝 Coding Standards

### Backend (Express.js)

- Gunakan ESLint dan Prettier
- Ikuti konvensi penamaan camelCase
- Gunakan async/await untuk asynchronous operations
- Tulis JSDoc untuk semua functions
- Gunakan proper error handling

**Contoh:**
```javascript
/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @returns {Promise<Object>} Created user
 */
const createUser = async (userData) => {
  try {
    const hashedPassword = await hashPassword(userData.password)
    const user = await User.create({
      ...userData,
      password: hashedPassword
    })
    return user
  } catch (error) {
    throw new Error(`Failed to create user: ${error.message}`)
  }
}
```

### Frontend (React.js)

- Gunakan functional components dengan hooks
- Ikuti konvensi penamaan PascalCase untuk components
- Gunakan TypeScript untuk type safety
- Gunakan Tailwind CSS untuk styling
- Tulis prop types atau TypeScript interfaces

**Contoh:**
```jsx
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

const UserCard = ({ user, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="text-lg font-semibold">{user.name}</h3>
        <p className="text-gray-600">{user.email}</p>
      </div>
    </div>
  )
}

UserCard.propTypes = {
  user: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired
}

export default UserCard
```

### Database

- Gunakan migrations untuk perubahan schema
- Tulis queries yang efisien
- Gunakan proper indexing
- Ikuti konvensi penamaan snake_case

### Commit Messages

Gunakan format Conventional Commits:

- `feat:` - Fitur baru
- `fix:` - Bug fix
- `docs:` - Dokumentasi
- `style:` - Formatting, semicolons, etc.
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

**Contoh:**
```bash
feat: add user authentication system
fix: resolve login validation error
docs: update API documentation
```

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd frontend
npm test
```

### Test Coverage

Pastikan test coverage minimal 80% untuk kode baru.

## 🔍 Pull Request Process

### Before Submitting

1. **Update documentation** jika diperlukan
2. **Add tests** untuk kode baru
3. **Update README** jika ada perubahan setup
4. **Check linting** dengan `npm run lint`
5. **Run tests** dan pastikan semua passing

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated checks** harus passing
2. **Code review** oleh minimal 1 reviewer
3. **Testing** di development environment
4. **Approval** dari maintainer

## 🐛 Issue Reporting

### Bug Reports

Gunakan template berikut:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g. macOS, Windows, Linux]
 - Browser: [e.g. Chrome, Firefox, Safari]
 - Version: [e.g. 1.0.0]

**Additional context**
Add any other context about the problem.
```

### Feature Requests

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
A clear description of any alternative solutions.

**Additional context**
Add any other context or screenshots.
```

## 📞 Getting Help

- **GitHub Issues** - Untuk bugs dan feature requests
- **Discussions** - Untuk pertanyaan umum
- **Email** - Untuk masalah sensitif

## 🎉 Recognition

Kontributor akan diakui di:
- README.md
- Release notes
- GitHub contributors page

Terima kasih atas kontribusi Anda! 🙏
