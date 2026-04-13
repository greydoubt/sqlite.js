// Iterator and Constructor Functions

// /// // ///  When accessor functions do not exist for a field (many internal fields are never exported), look at functions that iterate or construct instances of the struct. These functions touch many fields and reveal the overall layout.
// The Iterator Pattern

// Functions named *_iterate, *_foreach, or *_walk traverse linked lists of kernel objects. They reveal:
//     The global head pointer of the list (a kernel global variable)
//     The list entry offset within the struct. It is often +0x00 for the primary list, but a struct can have multiple list entries at different offsets (e.g. proc.p_list at +0x00 vs proc.p_hash at +0xA0)
//     The count variable (for instance nprocs, in proc_iterate)
//     Various field accesses used for filtering


// Each generated function implicitly exposes:
// /// ✅ Global head pointer → allproc
// /// ✅ List entry offset → p_list @ 0x00, p_hash @ 0xA0
// /// ✅ Count variable → nprocs
// /// ✅ Filtering logic → applied during iteration

// sample input

const procStruct = {
  name: "proc",
  globalHead: "allproc",
  countVar: "nprocs",
  listEntries: [
    { name: "p_list", offset: 0x00 },
    { name: "p_hash", offset: 0xA0 }
  ],
  fields: [
    { name: "p_pid", type: "int" },
    { name: "p_comm", type: "string" }
  ],
  filters: ["p_pid != 0"]
};


// 🏗️ Class Design
// 1. Struct Analyzer

// Extracts metadata from the struct.
class StructAnalyzer {
  constructor(structDef) {
    this.struct = structDef;
  }

  getGlobalHead() {
    return this.struct.globalHead;
  }

  getCountVar() {
    return this.struct.countVar;
  }

  getListEntries() {
    return this.struct.listEntries || [];
  }

  getFilters() {
    return this.struct.filters || [];
  }

  summarize() {
    return {
      name: this.struct.name,
      head: this.getGlobalHead(),
      count: this.getCountVar(),
      entries: this.getListEntries(),
      filters: this.getFilters()
    };
  }
}


// 2. Walker Generator

// Generates traversal functions (*_iterate, *_foreach, *_walk)
class WalkerGenerator {
  constructor(analyzer) {
    this.analyzer = analyzer;
  }

  generateIterators() {
    const structName = this.analyzer.struct.name;
    const entries = this.analyzer.getListEntries();

    const functions = {};

    entries.forEach(entry => {
      const fnBase = `${structName}_${entry.name}`;

      functions[`${fnBase}_iterate`] = this._buildIterator(entry);
      functions[`${fnBase}_foreach`] = this._buildForeach(entry);
      functions[`${fnBase}_walk`] = this._buildWalk(entry);
    });

    return functions;
  }

  _buildIterator(entry) {
    const head = this.analyzer.getGlobalHead();
    const filters = this.analyzer.getFilters();

    return function* (memory) {
      let current = memory[head];

      while (current) {
        let pass = true;

        for (const f of filters) {
          if (!evaluateFilter(current, f)) {
            pass = false;
            break;
          }
        }

        if (pass) yield current;

        current = current.next; // simplified linked list
      }
    };
  }

  _buildForeach(entry) {
    const iterator = this._buildIterator(entry);

    return function (memory, callback) {
      for (const item of iterator(memory)) {
        callback(item);
      }
    };
  }

  _buildWalk(entry) {
    const head = this.analyzer.getGlobalHead();

    return function (memory, visitor) {
      let current = memory[head];

      while (current) {
        visitor(current);
        current = current.next;
      }
    };
  }
}

// 3. Filter Evaluator

// Very simple expression evaluator (you can expand this later)
function evaluateFilter(obj, expr) {
  // VERY basic parser: "p_pid != 0"
  const [field, op, value] = expr.split(" ");

  switch (op) {
    case "!=":
      return obj[field] != Number(value);
    case "==":
      return obj[field] == Number(value);
    default:
      return true;
  }
}

const analyzer = new StructAnalyzer(procStruct);
const generator = new WalkerGenerator(analyzer);

const walkers = generator.generateIterators();

// Example memory simulation
const memory = {
  allproc: {
    p_pid: 1,
    next: {
      p_pid: 0,
      next: {
        p_pid: 42,
        next: null
      }
    }
  }
};

// Iterate
for (const proc of walkers.proc_p_list_iterate(memory)) {
  console.log("ITER:", proc);
}

// Foreach
walkers.proc_p_list_foreach(memory, p => {
  console.log("FOREACH:", p);
});

// Walk (no filtering)
walkers.proc_p_list_walk(memory, p => {
  console.log("WALK:", p);
});
