import type { Lesson } from '../../types';

export const day6: Lesson = {
  day: 6,
  title: 'OOP the Python Way: Dunders, Dataclasses & Protocols',
  subtitle: 'The Data Model, __new__ vs __init__, @dataclass, Properties, MRO, and typing.Protocol',
  estimatedMinutes: 45,
  category: 'core',
  seniorBridge: {
    csharp: 'In C#, interfaces are nominal (`class Dog : IAnimal`), records are value types, and properties use `get; set;` syntax. In Python, `@dataclass(frozen=True)` matches C# `record`, `@property` defines getters/setters, and `typing.Protocol` provides compile-time structural typing (like TypeScript interfaces).',
    c_modula2: 'Coming from Modula-2 abstract data types (ADTs) and C structs with function pointers: Python classes are first-class objects at runtime. Special dunder methods (`__len__`, `__getitem__`) allow your custom classes to integrate directly into Python operators.',
    javascript: 'Python has explicit class-based inheritance rather than prototype chaining. There is no implicit `this`; the instance is explicitly passed as the first parameter `self`. `__repr__` serves the role of an unambiguous debug string, while `__str__` is like `toString()`.',
    c64_basic: 'Forget managing raw memory addresses and state variables manually. Python OOP provides encapsulation, inheritance, polymorphism, and protocol compliance.',
  },
  overview: 'Object-oriented programming in Python is fundamentally driven by the "Python Data Model" (special double-underscore "dunder" methods). Writing idiomatic Python OOP does not mean creating deep inheritance hierarchies with getters and setters. It means writing lean classes that behave like native Python types using `@dataclass`, clean `@property` decorators, and structural subtyping with `typing.Protocol`.',
  keyTakeaways: [
    '`__new__` creates and returns the new instance; `__init__` initializes that instance. 99% of classes only need `__init__`.',
    'Explicit `self` is intentional: it makes method dispatch transparent and distinguishes local variables from instance attributes.',
    '`__repr__` should be unambiguous and developer-focused (ideally valid Python code to recreate the object); `__str__` is for human-readable end-user display.',
    'Don\'t write manual getters and setters (`get_age()` / `set_age()`). Use direct attribute access initially; if you need validation or computation later, transparently wrap it with `@property` and `@x.setter` without breaking existing callers.',
    '`@dataclass` automatically generates `__init__`, `__repr__`, `__eq__`, and ordering methods. Use `frozen=True` for immutable value objects (like C# `record`).',
    'Python supports multiple inheritance using the C3 Linearization algorithm to determine Method Resolution Order (MRO). Check `Class.__mro__` to inspect call order.',
    '`typing.Protocol` enables structural subtyping (static duck typing). A class satisfies a `Protocol` if it has the required methods and signatures, without explicit inheritance.',
  ],
  sections: [
    {
      id: 'construction-and-self',
      title: '1. Object Lifecycle: __new__ vs __init__ and Explicit self',
      content: `When you invoke a class \`obj = Car("blue")\`, Python executes:
1. \`Car.__new__(Car, "blue")\`: A static method that allocates memory and returns the fresh uninitialized instance.
2. \`instance.__init__("blue")\`: Initializes the newly created instance.

**Why is \`self\` explicit?**
In Python, methods are just functions attached to a class namespace. When you call \`car.drive(10)\`, Python automatically translates this to \`Car.drive(car, 10)\`. Explicit \`self\` ensures clarity in lexical scoping—reading \`speed\` vs \`self.speed\` immediately distinguishes local variables from object attributes.`,
      codeSnippet: `class SingletonConnection:
    _instance = None

    def __new__(cls, *args, **kwargs):
        # __new__ controls instance creation:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, host: str):
        self.host = host

c1 = SingletonConnection("db.prod")
c2 = SingletonConnection("db.staging")
print(c1 is c2)       # True!
print(c1.host)        # 'db.staging' (re-initialized)`,
      seniorInsight: 'Use `__new__` when implementing Singletons, object pools, or subclassing immutable types like `int`, `str`, or `tuple` where initialization must happen before creation.',
    },
    {
      id: 'the-data-model-dunders',
      title: '2. The Data Model: Essential Dunder Methods',
      content: `Python uses special methods with double underscores ("dunders") to hook into language operators and built-in functions:

- \`__repr__(self)\`: Developer representation. If \`__str__\` is missing, Python falls back to \`__repr__\`.
- \`__str__(self)\`: User representation (called by \`print()\` and \`str()\`).
- \`__len__(self)\`: Called by \`len()\`.
- \`__getitem__(self, key)\`: Enables square bracket indexing \`obj[key]\`.
- \`__eq__(self, other)\`: Called by \`==\`.
- \`__hash__(self)\`: Enables using the object in sets or as dictionary keys.`,
      codeSnippet: `class TransactionBatch:
    def __init__(self, batch_id: str, items: list[float]):
        self.batch_id = batch_id
        self.items = items

    def __len__(self):
        return len(self.items)

    def __getitem__(self, index):
        return self.items[index]

    def __repr__(self):
        return f"TransactionBatch({self.batch_id!r}, items={len(self.items)})"

batch = TransactionBatch("B-402", [10.5, 20.0, 99.9])
print(repr(batch))  # TransactionBatch('B-402', items=3)
print(len(batch))   # 3
print(batch[1])     # 20.0 (Supports indexing and slicing!)
print(list(batch))  # [10.5, 20.0, 99.9] (Automatic iterator support via __getitem__!)`,
      seniorInsight: 'Notice how implementing just `__len__` and `__getitem__` automatically gives your class support for `for x in batch:`, slicing `batch[0:2]`, and `in` membership checks! That is the elegance of Python\'s sequence protocol.',
    },
    {
      id: 'properties-vs-getters',
      title: '3. Encapsulation: @property vs Java/C# Getters',
      content: `In Java or C#, you might routinely write:
\`\`\`csharp
public decimal Balance { get; set; }
\`\`\`
In Python, the rule is: **Start with a plain public attribute (\`self.balance\`)**. 

Do NOT write \`get_balance()\` / \`set_balance()\`. If you later need validation, caching, or lazy loading, you can convert \`balance\` into a \`@property\` with a setter without altering the public API! Existing callers using \`account.balance = 50\` will continue working without code changes.`,
      codeSnippet: `class BankAccount:
    def __init__(self, initial_balance: float):
        self._balance = initial_balance  # Leading underscore = private convention

    @property
    def balance(self) -> float:
        """The balance property getter."""
        return self._balance

    @balance.setter
    def balance(self, value: float):
        if value < 0:
            raise ValueError("Balance cannot be negative")
        self._balance = value

acc = BankAccount(100.0)
print(acc.balance)  # 100.0
acc.balance = 250.0  # Invokes @balance.setter transparently
# acc.balance = -10  -> Raises ValueError!`,
      seniorInsight: 'In Python, attributes with a single leading underscore (e.g. `_balance`) are considered "internal/private by convention". Python does not have compiler-enforced access modifiers.',
    },
    {
      id: 'dataclasses-and-protocols',
      title: '4. Dataclasses & Structural Subtyping (typing.Protocol)',
      content: `### @dataclass (PEP 557)
Replaces repetitive boilerplate constructors. Supports immutability via \`frozen=True\` and default factory collections.

### typing.Protocol (PEP 544)
Traditional Python uses runtime duck typing ("if it walks like a duck..."). \`Protocol\` brings **compile-time structural typing** to Python (identical to TypeScript interfaces or Go interfaces).

A class doesn't need to inherit from the Protocol; it simply needs to match the method signatures!`,
      codeSnippet: `from dataclasses import dataclass, field
from typing import Protocol, runtime_checkable

# 1. Immutable Dataclass (like C# record):
@dataclass(frozen=True)
class Customer:
    id: str
    email: str
    tags: list[str] = field(default_factory=list)

# 2. Structural Subtyping with Protocol:
@runtime_checkable
class Notifier(Protocol):
    def send(self, recipient: str, message: str) -> bool: ...

class EmailService:
    # Notice: DOES NOT inherit from Notifier!
    def send(self, recipient: str, message: str) -> bool:
        print(f"Sending email to {recipient}: {message}")
        return True

def notify_user(service: Notifier, user: str, msg: str):
    service.send(user, msg)

email_svc = EmailService()
print("Is instance of Notifier?", isinstance(email_svc, Notifier))  # True!
notify_user(email_svc, "alice@co.com", "Server maintenance tonight")`,
      seniorInsight: 'Use `typing.Protocol` over `abc.ABC` whenever you want loose coupling without forcing your libraries or callers to inherit from concrete base classes.',
    },
  ],
  codeExamples: [
    {
      title: 'MRO (Method Resolution Order) and Cooperative Multiple Inheritance',
      description: 'Understanding how C3 linearization resolves multiple inheritance and super() calls.',
      pythonCode: `class Base:
    def action(self):
        print("Base action")

class LoggingMixin(Base):
    def action(self):
        print("[LOG] Starting action")
        super().action()
        print("[LOG] Finished action")

class MetricMixin(Base):
    def action(self):
        print("[METRIC] Incrementing counter")
        super().action()

class Service(LoggingMixin, MetricMixin):
    pass

svc = Service()
svc.action()
print("MRO Order:", [c.__name__ for c in Service.__mro__])`,
      runnable: true,
      expectedOutput: `[LOG] Starting action
[METRIC] Incrementing counter
Base action
[LOG] Finished action
MRO Order: ['Service', 'LoggingMixin', 'MetricMixin', 'Base', 'object']`,
    },
    {
      title: 'Complete Dataclass with Post-Init Validation',
      description: 'Using __post_init__ to calculate derived fields and enforce business invariants.',
      pythonCode: `from dataclasses import dataclass

@dataclass(frozen=True)
class OrderLine:
    product_id: str
    quantity: int
    unit_price: float
    total: float = 0.0

    def __post_init__(self):
        if self.quantity <= 0:
            raise ValueError("Quantity must be positive")
        # In a frozen dataclass, use object.__setattr__ in __post_init__:
        object.__setattr__(self, "total", round(self.quantity * self.unit_price, 2))

order = OrderLine("SKU-99", 5, 19.99)
print(order)
print("Total price:", order.total)`,
      runnable: true,
      expectedOutput: `OrderLine(product_id='SKU-99', quantity=5, unit_price=19.99, total=99.95)
Total price: 99.95`,
    },
  ],
  quiz: [
    {
      id: 'd6-q1',
      question: 'What is the role of `__new__` versus `__init__` in Python object instantiation?',
      options: [
        '`__new__` initializes instance variables, while `__init__` allocates the heap memory.',
        '`__new__` is a static method responsible for creating and returning the object instance, while `__init__` initializes the newly created instance.',
        '`__new__` is only called for subclasses of `Exception`.',
        'Both methods are interchangeable aliases.',
      ],
      correctIndex: 1,
      explanation: '`__new__(cls, ...)` is the actual constructor that allocates the object in memory and returns it. `__init__(self, ...)` is the initializer that receives the newly created object as `self` to set up its attributes. `__new__` is rarely overridden except when implementing singletons or subclassing immutable built-in types.',
      seniorTrap: 'Coming from C# or Java where the constructor `ClassName()` handles both allocation and initialization, in Python this lifecycle is split into `__new__` and `__init__`.',
    },
    {
      id: 'd6-q2',
      question: 'What is the key difference between `__repr__` and `__str__` in Python?',
      options: [
        '`__repr__` is for developer debugging (ideally unambiguous and matching valid Python syntax), while `__str__` is for end-user readable formatting.',
        '`__str__` is called by `print()`, while `__repr__` is deprecated.',
        '`__repr__` returns bytes, while `__str__` returns text.',
        '`__repr__` is only available on dataclasses.',
      ],
      correctIndex: 0,
      explanation: 'The rule of thumb: `__repr__` should be unambiguous, developer-focused, and if possible look like the Python expression that could recreate the object (e.g. `Point(x=1, y=2)`). `__str__` is intended to be user-friendly. If a class defines `__repr__` without `__str__`, Python falls back to `__repr__` for `print()`.',
      seniorTrap: 'In C# or JS, there is only `ToString()`. Python provides two representations; senior engineers always implement `__repr__` first.',
    },
    {
      id: 'd6-q3',
      question: 'Why is setting default list arguments in `@dataclass` fields as `items: list = []` prohibited?',
      options: [
        'Because dataclasses do not support lists.',
        'Because `[]` is mutable, and sharing it would make all instances of the dataclass share the same list in memory. Python requires `field(default_factory=list)`.',
        'Because dataclass attributes must be primitive types.',
        'Because dataclasses require frozen sets instead.',
      ],
      correctIndex: 1,
      explanation: 'Just like default arguments in functions, dataclass field defaults are evaluated when the class is defined. Allowing `items: list = []` would cause every instance to share the exact same list. Dataclasses explicitly raise `ValueError: mutable default [] for field items is not allowed: use default_factory` to protect you.',
      seniorTrap: 'Dataclasses enforce this safety check at class creation time, forcing you to write `field(default_factory=list)`.',
    },
    {
      id: 'd6-q4',
      question: 'How does `typing.Protocol` (PEP 544) differ from inheriting from an Abstract Base Class (`abc.ABC`)?',
      options: [
        '`typing.Protocol` uses nominal subtyping, requiring classes to explicitly inherit from it.',
        '`typing.Protocol` enables structural subtyping (compile-time duck typing): a class satisfies the protocol if its shape matches, without needing to inherit from the protocol class.',
        '`typing.Protocol` can only be used with async methods.',
        '`typing.Protocol` compiles Python code into C++ headers.',
      ],
      correctIndex: 1,
      explanation: 'With `abc.ABC`, a class MUST explicitly inherit from the ABC (nominal subtyping). With `typing.Protocol`, any class that implements the methods with matching signatures satisfies the type check (structural subtyping), eliminating rigid coupling to external base classes.',
      seniorTrap: 'C# developers are used to explicit interface inheritance (`class Foo : IFoo`). `typing.Protocol` allows structural interface matching without modifying third-party classes.',
    },
    {
      id: 'd6-q5',
      question: 'What is the Pythonic philosophy regarding getters and setters on class attributes?',
      options: [
        'Always create private variables (`__x`) with explicit `get_x()` and `set_x()` methods from day one.',
        'Start with simple public attributes (`self.x`); if logic/validation is needed later, convert it to a `@property` without breaking existing callers.',
        'Attributes should only be accessed through dictionary lookups.',
        'Python forbids attributes from being modified after `__init__`.',
      ],
      correctIndex: 1,
      explanation: 'In Java or C#, boilerplate getters and setters are written preemptively because changing a public field to a property would break binary compatibility. In Python, `@property` allows changing a plain attribute into a getter/setter seamlessly without changing caller syntax (`obj.x`).',
      seniorTrap: 'Writing `get_foo()` and `set_foo()` is an immediate giveaway of a non-Pythonic codebase written by someone carrying over Java/C# habits.',
    },
    {
      id: 'd6-q6',
      question: 'What algorithm does Python use to calculate the Method Resolution Order (MRO) in multiple inheritance?',
      options: [
        'Depth-First Search (DFS)',
        'Breadth-First Search (BFS)',
        'C3 Linearization',
        'Dijkstra\'s Algorithm',
      ],
      correctIndex: 2,
      explanation: 'Python uses the C3 Linearization algorithm to determine MRO. It guarantees monotonicity (parents are always checked in the order listed) and that a class always precedes its superclasses. You can inspect it on any class via `Class.__mro__`.',
      seniorTrap: 'Older languages like C++ use DFS for multiple inheritance which can suffer from the classic diamond problem. C3 Linearization guarantees a predictable, linearized hierarchy.',
    },
    {
      id: 'd6-q7',
      question: 'What is the effect of setting `frozen=True` on a `@dataclass` decorator?',
      options: [
        'It converts the class into a C extension.',
        'It makes instances immutable: attempting to assign to any attribute raises a `FrozenInstanceError`, and it automatically generates a `__hash__` method.',
        'It encrypts the class bytecode in memory.',
        'It prevents other classes from inheriting from it.',
      ],
      correctIndex: 1,
      explanation: 'A frozen dataclass (`@dataclass(frozen=True)`) prevents modifications to its attributes after initialization. Because it is immutable, it can safely generate a `__hash__` method, making instances usable as dictionary keys and set elements (analogous to C# `record`).',
      seniorTrap: 'Standard dataclasses have `__hash__ = None` because mutable objects cannot be hashed. Setting `frozen=True` makes them hashable value objects.',
    },
    {
      id: 'd6-q8',
      question: 'In Python, what is the meaning of a single leading underscore on an attribute name, such as `self._db_conn`?',
      options: [
        'It triggers hardware memory protection.',
        'It is a universal convention indicating that the attribute is internal or private to the class/module, though it is not strictly enforced by the interpreter.',
        'It marks the attribute as a static class variable.',
        'It causes the interpreter to automatically delete the attribute after `__init__`.',
      ],
      correctIndex: 1,
      explanation: 'Python adheres to the principle of "We are all consenting adults here". A single leading underscore `_name` is an indicator to other developers and linters that an attribute or function is private/internal, but the language runtime does not restrict access.',
      seniorTrap: 'A double leading underscore (`__name`) triggers "name mangling" (renaming to `_ClassName__name`) to prevent accidental overrides in subclasses, NOT for security or privacy.',
    },
  ],
};
