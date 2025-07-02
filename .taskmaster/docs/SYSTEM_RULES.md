# TASKMASTER SYSTEM RULES

## Overview

This document defines how Taskmaster should operate internally, including how to reference project documentation, create quality tasks, and maintain consistency across the project workflow.

---

## Documentation Reference System

### 📚 **Documentation Hierarchy**
1. **Project Rules** (`.devdocs/TASKMASTER_RULES.md`) - Primary rules for this specific project
2. **Architecture Docs** (`.devdocs/ARCHITECTURE.md`) - System architecture and patterns
3. **Storage Docs** (`.devdocs/STORAGE_ARCHITECTURE.md`) - Media and data storage patterns
4. **Roo Rules** (`.roo/rules/`) - Development workflow and tool-specific patterns
5. **System Docs** (`.taskmaster/docs/`) - Taskmaster internal operations

### 🔍 **Pre-Task Analysis Protocol**
Before creating or modifying tasks, Taskmaster must:

```bash
# Step 1: Read project-specific rules
READ: .devdocs/TASKMASTER_RULES.md

# Step 2: Reference relevant architecture
READ: .devdocs/ARCHITECTURE.md (sections relevant to task)

# Step 3: Check for existing patterns
SEARCH: Codebase for similar implementations

# Step 4: Verify dependencies
ANALYZE: Task dependencies and architecture impact
```

---

## Task Creation Intelligence

### 🧠 **Context-Aware Task Generation**
When generating tasks, always include:

```markdown
## Architecture Context
- **Component**: [Frontend/Backend/Database layer this affects]
- **Pattern**: [Specific architecture pattern being implemented]
- **Dependencies**: [Architecture components this relies on]
- **Impact**: [What other components this might affect]

## Implementation Guidelines
- **Reference**: [Link to relevant architecture section]
- **Patterns**: [Established code patterns to follow]
- **Security**: [Security considerations from docs]
- **Testing**: [Testing strategy based on component type]
```

### 📋 **Smart Task Templates**

#### Frontend Tasks Template
```json
{
  "title": "[Component] - [Action] following [Pattern]",
  "description": "Implement [feature] using [established pattern] from architecture",
  "details": "**Architecture Reference**: [Link to ARCHITECTURE.md section]\n**Component Pattern**: [Specific pattern]\n**Implementation Steps**:\n1. [Step referencing pattern]\n2. [Step with security consideration]\n3. [Step with testing requirement]",
  "testStrategy": "[Component-specific testing approach from architecture]",
  "dependencies": ["[IDs of prerequisite architecture components]"],
  "priority": "[Based on architecture dependency chain]"
}
```

#### Backend Tasks Template
```json
{
  "title": "[Service/Controller/Route] - [Action] following MVC",
  "description": "Implement [feature] using established service layer pattern",
  "details": "**Architecture Reference**: [Link to backend architecture section]\n**MVC Layer**: [Controller/Service/Model]\n**Security Requirements**: [From security architecture]\n**Implementation Steps**:\n1. [Database layer change if needed]\n2. [Service layer implementation]\n3. [Controller integration]\n4. [Route definition]",
  "testStrategy": "[API testing strategy from architecture]",
  "dependencies": ["[Database schema tasks]", "[Auth dependencies]"],
  "priority": "[Based on API dependency chain]"
}
```

---

## Quality Assurance Rules

### ✅ **Task Validation Checklist**
Before finalizing any task:

- [ ] **Architecture Aligned**: Task follows established patterns
- [ ] **Documentation Referenced**: Links to relevant architecture sections
- [ ] **Dependencies Clear**: Prerequisites properly identified
- [ ] **Testable**: Clear acceptance criteria defined
- [ ] **Security Considered**: Security implications addressed
- [ ] **Impact Assessed**: Effects on other components evaluated

### 🔄 **Update Intelligence**
When updating tasks based on implementation learnings:

```markdown
## Update Protocol
1. **Check Architecture Impact**: Does this change affect documented patterns?
2. **Update Dependencies**: Do related tasks need modification?
3. **Maintain Consistency**: Ensure all tasks follow same patterns
4. **Document Changes**: Log significant architectural decisions
```

---

## Research Integration

### 🔬 **Research Trigger Conditions**
Automatically trigger research when:
- Task involves new technology not in architecture docs
- Security-related implementation needed
- Performance optimization required
- External API integration planned
- Dependency updates affecting architecture

### 📚 **Research Context Building**
When conducting research, always include:

```markdown
## Current Architecture Context
[Relevant sections from ARCHITECTURE.md]

## Existing Implementation Patterns
[Current codebase examples]

## Security Requirements
[From security architecture documentation]

## Integration Constraints
[Dependencies and limitations from docs]
```

---

## Workflow Automation

### 🤖 **Smart Expansion Logic**
When expanding tasks:

1. **Analyze Complexity**: Use architecture patterns to determine subtask granularity
2. **Follow Dependency Chain**: Respect architectural dependencies
3. **Apply Pattern Templates**: Use established implementation patterns
4. **Include Security Steps**: Auto-add security considerations
5. **Generate Test Strategy**: Create component-appropriate testing

### 📊 **Priority Intelligence**
Auto-assign priorities based on:
- **Critical**: Database schema, authentication, core API
- **High**: User-facing features, data integrity, security
- **Medium**: UI improvements, performance optimizations
- **Low**: Documentation, minor enhancements

---

## Error Prevention

### 🛡️ **Common Pitfalls to Avoid**
- Creating tasks that violate architecture patterns
- Missing security considerations from architecture docs
- Ignoring established dependency chains
- Creating untestable or vague requirements
- Not referencing existing implementation examples

### 🔧 **Auto-Correction Triggers**
If tasks are created that:
- Don't reference architecture documentation → Auto-add architecture context
- Miss security requirements → Auto-add security checklist
- Have unclear dependencies → Auto-analyze architecture dependencies
- Lack test strategy → Auto-generate component-appropriate testing

---

## Documentation Maintenance

### 📝 **Self-Updating Rules**
Taskmaster should automatically:
- Log new patterns discovered during implementation
- Update this document when new project rules are established
- Cross-reference documentation when inconsistencies are found
- Suggest updates to architecture docs when patterns evolve

### 🔗 **Documentation Sync**
Maintain consistency between:
- Project rules in `.devdocs/TASKMASTER_RULES.md`
- Architecture documentation in `.devdocs/ARCHITECTURE.md`
- Workflow patterns in `.roo/rules/`
- System operations in `.taskmaster/docs/`

---

## Performance Metrics

### 📈 **Quality Tracking**
Monitor:
- Task completion rate following architecture patterns
- Number of tasks requiring major revision due to architecture misalignment
- Research utilization effectiveness
- Documentation reference frequency

### 🎯 **Success Indicators**
- All tasks reference relevant architecture documentation
- Implementation follows established patterns consistently
- Dependencies respect architectural constraints
- Security considerations are never missed

---

## Integration with Roo Rules

### 🔄 **Roo Rules Compliance**
Ensure all Taskmaster operations align with:
- Development workflow patterns from `.roo/rules/dev_workflow.md`
- Technology-specific rules from `.roo/rules/`
- Code quality standards from Roo documentation

### 🤝 **Collaborative Intelligence**
When working with Roo:
- Reference Roo rules for implementation details
- Use project documentation for architectural decisions
- Maintain consistency between task requirements and code standards

---

*This system ensures Taskmaster operates as an intelligent project assistant that understands and follows established patterns while maintaining high-quality task generation and project consistency.* 