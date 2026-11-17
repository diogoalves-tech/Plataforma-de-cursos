/* EduConecta — funcionalidades da versão beta
   Front-end demonstrativo: os dados ficam no navegador (localStorage).
   Para autenticação e matrículas reais, será necessário um backend.
*/
"use strict";

const STORAGE = {
  users: "educonecta_users",
  currentUser: "educonecta_current_user",
  enrollments: "educonecta_enrollments",
  favorites: "educonecta_favorites"
};

const courses = [
  {
    id: "web1",
    title: "Fundamentos de Desenvolvimento Web I",
    category: "Tecnologia",
    instructor: "Prof. Diogo Alves",
    workload: "40h",
    description: "Aprenda HTML5 semântico, CSS3 responsivo, Flexbox, Grid e boas práticas de acessibilidade na web.",
    image: "https://placehold.co/600x300/1e40af/ffffff?text=Desenvolvimento+Web+I"
  },
  {
    id: "pesquisa",
    title: "Metodologia da Pesquisa Científica",
    category: "Pesquisa",
    instructor: "Prof. Jailson",
    workload: "30h",
    description: "Estruturação de artigos acadêmicos, revisão bibliográfica e normas técnicas para pesquisadores.",
    image: "https://placehold.co/600x300/0f766e/ffffff?text=Metodologia+Cientifica"
  },
  {
    id: "dados",
    title: "Modelagem e Projeto de Banco de Dados",
    category: "Dados",
    instructor: "Prof. Luiz O. Gonzaga",
    workload: "45h",
    description: "Conceitos de modelagem entidade-relacionamento, normalização e consultas SQL essenciais.",
    image: "https://placehold.co/600x300/334155/ffffff?text=Banco+de+Dados"
  },
  {
    id: "python",
    title: "Introdução à Programação com Python",
    category: "Tecnologia",
    instructor: "Equipe EduConecta",
    workload: "35h",
    description: "Lógica de programação, variáveis, condicionais, repetições e funções com Python.",
    image: "https://placehold.co/600x300/7c3aed/ffffff?text=Python"
  },
  {
    id: "dados-pesquisa",
    title: "Análise de Dados para Pesquisa",
    category: "Pesquisa",
    instructor: "Equipe EduConecta",
    workload: "25h",
    description: "Organize, explore e interprete dados para apoiar trabalhos acadêmicos.",
    image: "https://placehold.co/600x300/0369a1/ffffff?text=Analise+de+Dados"
  }
];

function readStorage(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch (error) {
    console.error(`Não foi possível ler ${key}:`, error);
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function showMessage(message, type = "success", targetId = "mensagem-global") {
  let area = document.getElementById(targetId);
  if (!area) {
    area = document.createElement("div");
    area.id = targetId;
    area.className = "mensagem-global";
    area.setAttribute("role", "status");
    area.setAttribute("aria-live", "polite");
    document.body.appendChild(area);
  }
  area.textContent = message;
  area.dataset.type = type;
  area.hidden = false;
}

function getCurrentUser() {
  return readStorage(STORAGE.currentUser, null);
}

function renderCourseCards(list, container) {
  if (!container) return;
  container.replaceChildren();

  if (list.length === 0) {
    const empty = document.createElement("p");
    empty.className = "estado-vazio";
    empty.textContent = "Nenhum curso encontrado. Tente outro termo ou categoria.";
    container.appendChild(empty);
    return;
  }

  const favorites = readStorage(STORAGE.favorites);
  const enrollments = readStorage(STORAGE.enrollments);

  list.forEach((course) => {
    const article = document.createElement("article");
    article.className = "card-curso";

    const image = document.createElement("img");
    image.src = course.image;
    image.alt = `Ilustração do curso ${course.title}`;
    image.loading = "lazy";

    const body = document.createElement("div");
    body.className = "card-corpo";

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = course.category;

    const title = document.createElement("h3");
    title.textContent = course.title;

    const description = document.createElement("p");
    description.textContent = course.description;

    const meta = document.createElement("div");
    meta.className = "card-meta";
    const instructor = document.createElement("span");
    instructor.textContent = course.instructor;
    const workload = document.createElement("span");
    workload.textContent = course.workload;
    meta.append(instructor, workload);

    const actions = document.createElement("div");
    actions.className = "acoes-curso";

    const enroll = document.createElement("button");
    enroll.type = "button";
    enroll.className = "btn";
    const enrolled = enrollments.some(item => item.courseId === course.id);
    enroll.textContent = enrolled ? "Matriculado" : "Matricular-se";
    enroll.disabled = enrolled;
    enroll.addEventListener("click", () => enrollInCourse(course.id));

    const favorite = document.createElement("button");
    favorite.type = "button";
    favorite.className = "btn btn-secundario";
    const isFavorite = favorites.includes(course.id);
    favorite.textContent = isFavorite ? "Remover favorito" : "Favoritar";
    favorite.setAttribute("aria-pressed", String(isFavorite));
    favorite.addEventListener("click", () => toggleFavorite(course.id));

    actions.append(enroll, favorite);
    body.append(badge, title, description, meta, actions);
    article.append(image, body);
    container.appendChild(article);
  });
}

function filterCourses() {
  const search = normalize(document.getElementById("busca-curso")?.value);
  const category = document.getElementById("filtro-categoria")?.value || "todas";
  const filtered = courses.filter(course => {
    const matchesSearch = normalize(
      `${course.title} ${course.description} ${course.instructor} ${course.category}`
    ).includes(search);
    const matchesCategory = category === "todas" || course.category === category;
    return matchesSearch && matchesCategory;
  });

  const count = document.getElementById("resultado-contagem");
  if (count) {
    count.textContent = `${filtered.length} ${filtered.length === 1 ? "curso encontrado" : "cursos encontrados"}`;
  }
  renderCourseCards(filtered, document.getElementById("lista-cursos"));
}

function enrollInCourse(courseId) {
  const user = getCurrentUser();
  if (!user) {
    showMessage("Entre na sua conta para realizar uma matrícula.", "error");
    window.location.href = "auth.html";
    return;
  }

  if (user.profile !== "aluno") {
    showMessage("A matrícula está disponível para contas do perfil Aluno.", "error");
    return;
  }

  const enrollments = readStorage(STORAGE.enrollments);
  if (enrollments.some(item => item.courseId === courseId && item.email === user.email)) {
    showMessage("Você já está matriculado neste curso.", "info");
    return;
  }

  enrollments.push({ courseId, email: user.email, date: new Date().toISOString() });
  writeStorage(STORAGE.enrollments, enrollments);
  showMessage("Matrícula realizada com sucesso!");
  filterCourses();
}

function toggleFavorite(courseId) {
  const favorites = readStorage(STORAGE.favorites);
  const index = favorites.indexOf(courseId);
  if (index >= 0) favorites.splice(index, 1);
  else favorites.push(courseId);
  writeStorage(STORAGE.favorites, favorites);
  showMessage(index >= 0 ? "Curso removido dos favoritos." : "Curso adicionado aos favoritos.");
  filterCourses();
}

function registerForm() {
  const form = document.getElementById("form-cadastro");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const name = document.getElementById("cad-nome").value.trim();
    const email = normalize(document.getElementById("cad-email").value);
    const password = document.getElementById("cad-senha").value;
    const profile = document.getElementById("cad-perfil").value;

    if (password.length < 8) {
      showMessage("A senha deve possuir pelo menos 8 caracteres.", "error");
      return;
    }

    const users = readStorage(STORAGE.users);
    if (users.some(user => user.email === email)) {
      showMessage("Já existe uma conta cadastrada com este e-mail.", "error");
      return;
    }

    // Protótipo acadêmico: não usar armazenamento local para senhas em produção.
    users.push({ name, email, password, profile });
    writeStorage(STORAGE.users, users);
    writeStorage(STORAGE.currentUser, { name, email, profile });
    showMessage("Cadastro concluído! Você já está conectado.");
    window.setTimeout(() => {
      window.location.href = profile === "instrutor" ? "instrutor.html" : "aluno.html";
    }, 700);
  });
}

function loginForm() {
  const form = document.getElementById("form-login");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const email = normalize(document.getElementById("login-email").value);
    const password = document.getElementById("login-senha").value;
    const user = readStorage(STORAGE.users).find(
      item => item.email === email && item.password === password
    );

    if (!user) {
      showMessage("E-mail ou senha incorretos. Confira os dados e tente novamente.", "error");
      return;
    }

    const session = { name: user.name, email: user.email, profile: user.profile };
    writeStorage(STORAGE.currentUser, session);
    showMessage(`Bem-vindo(a), ${user.name}!`);
    window.setTimeout(() => {
      window.location.href = user.profile === "instrutor" ? "instrutor.html" : "aluno.html";
    }, 700);
  });
}

function logout() {
  localStorage.removeItem(STORAGE.currentUser);
  showMessage("Você saiu da sua conta.");
  window.setTimeout(() => window.location.href = "pagina.html", 500);
}

function renderStudentArea() {
  const target = document.getElementById("area-aluno-conteudo");
  if (!target) return;
  const user = getCurrentUser();
  if (!user || user.profile !== "aluno") {
    target.textContent = "Entre com uma conta de aluno para visualizar suas matrículas.";
    return;
  }

  const mine = readStorage(STORAGE.enrollments).filter(item => item.email === user.email);
  const title = document.createElement("h2");
  title.textContent = `Olá, ${user.name}`;
  const intro = document.createElement("p");
  intro.textContent = `Você possui ${mine.length} ${mine.length === 1 ? "matrícula" : "matrículas"}.`;
  const list = document.createElement("ul");
  list.className = "lista-aulas";

  mine.forEach(item => {
    const course = courses.find(entry => entry.id === item.courseId);
    if (!course) return;
    const li = document.createElement("li");
    li.textContent = `${course.title} — ${course.workload}`;
    list.appendChild(li);
  });

  if (!mine.length) {
    const li = document.createElement("li");
    li.textContent = "Você ainda não possui matrículas. Explore o catálogo para começar.";
    list.appendChild(li);
  }

  target.replaceChildren(title, intro, list);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("busca-curso")?.addEventListener("input", filterCourses);
  document.getElementById("filtro-categoria")?.addEventListener("change", filterCourses);
  document.getElementById("limpar-filtros")?.addEventListener("click", () => {
    const search = document.getElementById("busca-curso");
    const category = document.getElementById("filtro-categoria");
    if (search) search.value = "";
    if (category) category.value = "todas";
    filterCourses();
  });

  const catalog = document.getElementById("lista-cursos");
  if (catalog) filterCourses();

  registerForm();
  loginForm();
  renderStudentArea();

  document.querySelectorAll("[data-logout]").forEach(button => {
    button.addEventListener("click", logout);
  });

  const welcome = document.getElementById("usuario-atual");
  const user = getCurrentUser();
  if (welcome && user) welcome.textContent = `Conectado como ${user.name} (${user.profile})`;
});
