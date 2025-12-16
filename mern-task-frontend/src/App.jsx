// /*
// React Task Manager (single-file app)

// Setup instructions (recommended):
// 1. Create a Vite React project (recommended):
//    npm create vite@latest mern-task-frontend -- --template react
//    cd mern-task-frontend
// 2. Install dependencies:
//    npm install
// 3. Install Tailwind CSS (optional but styles use Tailwind):
//    npm install -D tailwindcss postcss autoprefixer
//    npx tailwindcss init -p
//    // tailwind.config.cjs: content: ['./index.html','./src/**/*.{js,jsx}']
//    // src/index.css: @tailwind base; @tailwind components; @tailwind utilities;
//    import './index.css' in main.jsx
// 4. Replace src/App.jsx with the code below. Replace src/main.jsx and index.html as Vite default.
// 5. Run dev:
//    npm run dev

// Notes:
// - This component expects your backend at http://localhost:5000
// - It stores JWT in localStorage (key: token)
// - Basic features: Register, Login, List tasks, Create, Edit, Toggle complete, Delete, Logout
// - Improvements: better routing (React Router), form validation libs, prettier UI

// */

import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { Pencil, Check, X, Trash2 } from 'lucide-react';



const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return { token, setToken, user, setUser, logout };
}

async function apiFetch(path, token, opts = {}) {
  const headers = opts.headers || {};
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API_BASE + path, { ...opts, headers });
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, body: text ? JSON.parse(text) : null };
  } catch (e) {
    return { ok: res.ok, status: res.status, body: text };
  }
}

export default function App() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { token, setToken, user, setUser, logout } = auth;


  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    if (token) {
      setLoadingUser(true);
      apiFetch('/me', token).then(r => {
        setLoadingUser(false);
        if (r.ok && r.body && r.body.me) setUser(r.body.me);
        else {
          // token invalid
          logout();
        }
      }).catch(() => { setLoadingUser(false); logout(); });
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 flex items-start justify-center">
      <div className="max-w-4xl mx-auto">
        <Header user={user} onLogout={logout} />

        <div className="mt-6">
          <Routes>
            <Route
              path="/"
              element={<Navigate to={token ? "/tasks" : "/login"} />}
            />

            <Route
              path="/login"
              element={
                token ? (
                  <Navigate to="/tasks" />
                ) : (
                  <AuthForm
                    mode="login"
                    onSuccess={({ token: t }) => {
                      setToken(t);
                      navigate('/tasks');
                    }}
                    switchToRegister={() => navigate('/register')}
                  />
                )
              }
            />

            <Route
              path="/register"
              element={
                token ? (
                  <Navigate to="/tasks" />
                ) : (
                  <AuthForm
                    mode="register"
                    onSuccess={({ token: t }) => {
                      setToken(t);
                      navigate('/tasks');
                    }}
                    switchToLogin={() => navigate('/login')}
                  />
                )
              }
            />

            <Route
              path="/tasks"
              element={
                token ? (
                  <Tasks token={token} user={user} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}

import { CheckSquare, LogOut } from 'lucide-react';

function Header({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between mb-10">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <CheckSquare className="w-6 h-6 text-gray-900" />
        <h1 className="text-xl font-semibold tracking-tight">
          TaskPilot
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-2">
        {user ? (
          <>
            <Link
              to="/tasks"
              className="px-4 py-1.5 rounded-full text-sm bg-gray-900 text-white hover:scale-[1.02] transition"
            >
              Tasks
            </Link>

            <div className="flex items-center gap-3 ml-2">
              <span className="text-sm text-gray-500">
                {user.name}
              </span>

              <button
                onClick={() => {
                  onLogout();
                  navigate('/login');
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-full text-sm hover:bg-gray-100 transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-1.5 rounded-full text-sm bg-gray-900 text-white hover:scale-[1.02] transition"
            >
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}


function AuthForm({ mode, onSuccess, switchToRegister, switchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};

    if (mode === 'register' && !name.trim()) {
      errs.name = 'Name is required';
    }

    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Invalid email format';
    }

    if (!password.trim()) {
      errs.password = 'Password is required';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };


  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    // 👉 FRONTEND VALIDATION
    if (!validate()) return;

    setLoading(true);

    const path = mode === 'login' ? '/auth/login' : '/auth/register';
    const body = mode === 'login'
      ? { email, password }
      : { name, email, password };

    const res = await apiFetch(path, null, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (res.ok) {
      setFieldErrors({});   // clear inline errors
      onSuccess(res.body);
    } else {
      if (res.body && res.body.errors) {
        setError(res.body.errors.map(e => e.msg).join('; '));
      } else if (res.body && res.body.message) {
        setError(res.body.message);
      } else {
        setError('Unexpected error');
      }
    }
  };


  return (
    <div className="w-full max-w-md mt-20 bg-white rounded-2xl shadow-sm border p-8 animate-fadeIn">
      <h2 className="text-2xl font-semibold mb-1">
        {mode === 'login' ? 'Welcome back 👋' : 'Create your account ✨'}
      </h2>

      <p className="text-sm text-gray-500 mb-6">
        {mode === 'login'
          ? 'Login to manage your tasks'
          : 'Start organizing your work with TaskPilot'}
      </p>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        {mode === 'register' && (
          <div className="relative">
            <label className="block text-sm mb-1 text-gray-700">Name</label>

            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className={`w-full px-4 py-2 rounded-xl border bg-white
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-gray-900/10
        ${fieldErrors.name
                  ? 'border-amber-400 bg-amber-50/40'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            />

            {fieldErrors.name && (
              <p className="mt-1 text-xs text-amber-600 flex items-center gap-1 animate-fade-in">
                <span>⚠</span>
                {fieldErrors.name}
              </p>
            )}
          </div>
        )}


        <div className="relative">
          <label className="block text-sm mb-1 text-gray-700">Email</label>

          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`w-full px-4 py-2 rounded-xl border bg-white
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-gray-900/10
      ${fieldErrors.email
                ? 'border-amber-400 bg-amber-50/40'
                : 'border-gray-200 hover:border-gray-300'
              }`}
          />

          {fieldErrors.email && (
            <p className="mt-1 text-xs text-amber-600 flex items-center gap-1 animate-fade-in">
              <span>⚠</span>
              {fieldErrors.email}
            </p>
          )}
        </div>


        <div className="relative">
          <label className="block text-sm mb-1 text-gray-700">Password</label>

          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`w-full px-4 py-2 rounded-xl border bg-white
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-gray-900/10
      ${fieldErrors.password
                ? 'border-amber-400 bg-amber-50/40'
                : 'border-gray-200 hover:border-gray-300'
              }`}
          />

          {fieldErrors.password && (
            <p className="mt-1 text-xs text-amber-600 flex items-center gap-1 animate-fade-in">
              <span>⚠</span>
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 py-2.5 rounded-xl bg-gray-900 text-white font-medium hover:scale-[1.01] transition disabled:opacity-60"
        >
          {loading
            ? 'Please wait...'
            : mode === 'login'
              ? 'Login'
              : 'Create account'}
        </button>
      </form>

      <div className="mt-6 text-sm text-center">
        {mode === 'login' ? (
          <button
            type="button"
            onClick={switchToRegister}
            className="text-gray-600 hover:underline"
          >
            Don’t have an account? Sign up
          </button>
        ) : (
          <button
            type="button"
            onClick={switchToLogin}
            className="text-gray-600 hover:underline"
          >
            Already have an account? Login
          </button>
        )}
      </div>
    </div>
  );
}

function Tasks({ token, user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [completedFilter, setCompletedFilter] = useState('all'); // all | true | false
  const [sortOrder, setSortOrder] = useState('desc'); // desc | asc
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);



  const fetchTasks = async () => {
    setLoading(true);

    let query = `?page=${page}&limit=${limit}&sort=createdAt:${sortOrder}`;

    if (completedFilter !== 'all') {
      query += `&completed=${completedFilter}`;
    }

    const r = await apiFetch(`/tasks${query}`, token);

    setLoading(false);
    if (r.ok) {
      setTasks(r.body.tasks || []);
    } else {
      setError('Failed to load tasks');
    }
  };


  useEffect(() => {
    if (token) fetchTasks();
  }, [token, completedFilter, sortOrder, page, limit]);


  const createTask = async (e) => {
    e && e.preventDefault();
    setError(null);
    const r = await apiFetch('/tasks', token, { method: 'POST', body: JSON.stringify({ title, description }) });
    if (r.ok) {
      setTitle(''); setDescription('');
      fetchTasks();
    } else {
      setError((r.body && (r.body.message || (r.body.errors && r.body.errors.map(x => x.msg).join(', ')))) || 'Create failed');
    }
  };

  const toggleComplete = async (task) => {
    const r = await apiFetch(`/tasks/${task._id}`, token, { method: 'PUT', body: JSON.stringify({ completed: !task.completed }) });
    if (r.ok) fetchTasks();
    else setError('Update failed');
  };

  const removeTask = async (task) => {
    if (!confirm('Delete this task?')) return;
    const r = await apiFetch(`/tasks/${task._id}`, token, { method: 'DELETE' });
    if (r.ok) fetchTasks();
    else setError('Delete failed');
  };

  const startEdit = (task) => {
    setEditingId(task._id);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
  };

  const saveEdit = async (task) => {
    const r = await apiFetch(`/tasks/${task._id}`, token, {
      method: 'PUT',
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
      }),
    });

    if (r.ok) {
      fetchTasks();
      cancelEdit();
    } else {
      setError('Update failed');
    }
  };


  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-medium mb-4">Tasks for {user ? user.name : 'you'}</h2>

      <form
        onSubmit={createTask}
        className="mb-6 rounded-2xl bg-yellow-50 border border-yellow-200 p-4 shadow-sm"
      >
        <div className="flex flex-col gap-3">
          <input
            className="w-full bg-transparent border-b border-yellow-300 focus:border-yellow-500 outline-none px-1 py-2 text-sm placeholder-yellow-600"
            placeholder="✍️ Task title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <textarea
            className="w-full bg-transparent border-b border-yellow-300 focus:border-yellow-500 outline-none px-1 py-2 text-sm placeholder-yellow-600 resize-none"
            placeholder="Optional description…"
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-black text-white text-sm hover:scale-105 transition-transform"
            >
              ➕ Add task
            </button>
          </div>
        </div>
      </form>


      {error && <div className="text-red-600 mb-3">{error}</div>}

      {/* Toolbar */}
      <div className="mb-6">
        <div className="bg-gray-50 border rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-4 justify-between">

          {/* Left: Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <select
              className="px-4 py-2 rounded-full border bg-white text-sm focus:ring-2 focus:ring-gray-900/10"
              value={completedFilter}
              onChange={e => {
                setPage(1);
                setCompletedFilter(e.target.value);
              }}
            >
              <option value="all">All tasks</option>
              <option value="true">Completed</option>
              <option value="false">Incomplete</option>
            </select>

            <select
              className="px-4 py-2 rounded-full border bg-white text-sm focus:ring-2 focus:ring-gray-900/10"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>

          {/* Right: Pagination */}
          <div className="flex items-center gap-3">
            <select
              className="px-3 py-2 rounded-full border bg-white text-sm"
              value={limit}
              onChange={e => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
            </select>

            <div className="flex items-center gap-2 bg-white border rounded-full px-2 py-1">
              <button
                className="px-3 py-1 rounded-full text-sm hover:bg-gray-100 disabled:opacity-40"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Prev
              </button>

              <span className="text-xs text-gray-500 px-1">
                Page {page}
              </span>

              <button
                className="px-3 py-1 rounded-full text-sm hover:bg-gray-100"
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>



      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-5">
          {tasks.length === 0 && <div className="text-sm text-gray-600">No tasks yet</div>}
          {tasks.map(t => (
            <div
              key={t._id}
              className={`relative rounded-2xl p-4 border shadow-sm transition hover:shadow-md bg-white
      ${t.completed ? 'opacity-70 bg-gray-50' : ''}`}
            >
              {/* Completion stripe */}
              <div
                className={`absolute left-0 top-0 h-full w-1 rounded-l-2xl
        ${t.completed ? 'bg-green-400' : 'bg-yellow-400'}`}
              />

              <div className="flex justify-between gap-4">
                {/* Content */}
                <div className="flex-1 pl-2">
                  {editingId === t._id ? (
                    <>
                      <input
                        className="w-full mb-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900/10"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                      />
                      <input
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900/10"
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                      />
                    </>
                  ) : (
                    <>
                      <h3
                        className={`font-medium text-lg ${t.completed ? 'line-through text-gray-500' : ''
                          }`}
                      >
                        {t.title}
                      </h3>

                      {t.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {t.description}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(t.createdAt).toLocaleString()}
                      </p>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {editingId === t._id ? (
                    <>
                      <button
                        onClick={() => saveEdit(t)}
                        className="p-2 rounded-lg bg-green-500 text-white hover:scale-105 transition"
                        title="Save"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-2 rounded-lg bg-gray-400 text-white hover:scale-105 transition"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(t)}
                        className="p-2 rounded-lg bg-yellow-400 text-white hover:scale-105 transition"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => toggleComplete(t)}
                        className={`p-2 rounded-lg text-white hover:scale-105 transition
                ${t.completed ? 'bg-gray-400' : 'bg-blue-500'}`}
                        title="Toggle complete"
                      >
                        <Check size={16} />
                      </button>

                      <button
                        onClick={() => removeTask(t)}
                        className="p-2 rounded-lg bg-red-500 text-white hover:scale-105 transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
