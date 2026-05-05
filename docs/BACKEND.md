# AURIA — Guía del backend (Symfony)

> **Antes de empezar, lee `ENDPOINTS.md`.** Este archivo te dice cómo construir el backend; el contrato te dice **qué** tiene que cumplir. Si hay una discrepancia, manda el contrato.

> **Patrón que seguimos:** MVC clásico de Symfony. Doctrine como ORM (modelo), controllers a mano (controlador), respuestas JSON (no hay vista, el frontend es Angular).

---

## Tabla de contenidos

1. [Pre-requisitos](#1-pre-requisitos)
2. [Crear el proyecto](#2-crear-el-proyecto)
3. [Estructura de directorios](#3-estructura-de-directorios)
4. [Configuración inicial](#4-configuración-inicial)
5. [Entidades (modelo)](#5-entidades-modelo)
6. [Migraciones](#6-migraciones)
7. [Configurar JWT y Security](#7-configurar-jwt-y-security)
8. [Configurar CORS](#8-configurar-cors)
9. [DTOs / Normalización de respuestas](#9-dtos--normalización-de-respuestas)
10. [Controladores](#10-controladores)
11. [Validación](#11-validación)
12. [Manejo global de errores](#12-manejo-global-de-errores)
13. [Fixtures (datos de prueba)](#13-fixtures-datos-de-prueba)
14. [Arrancar y probar](#14-arrancar-y-probar)
15. [Problemas comunes](#15-problemas-comunes)

---

## 1. Pre-requisitos

Verifica que tienes instalado:

```bash
php --version          # 8.2 o superior
composer --version     # 2.x
symfony --version      # Symfony CLI
mysql --version        # 8.x (vale MariaDB también)
```

Si falta algo:
- **PHP 8.2+**: instala desde tu gestor de paquetes o XAMPP/Laragon.
- **Composer**: https://getcomposer.org/download/
- **Symfony CLI**: https://symfony.com/download
- **MySQL**: incluido en XAMPP/Laragon, o por Docker.

---

## 2. Crear el proyecto

Desde la raíz del mono-repo:

```bash
symfony new api --version="7.1.*" --webapp
cd api
```

Esto crea un proyecto Symfony 7 con todos los bundles habituales (Doctrine, Twig, Forms, etc.). Vamos a quitar lo que no necesitamos y añadir lo específico.

### 2.1 Instalar bundles necesarios

```bash
composer require lexik/jwt-authentication-bundle
composer require nelmio/cors-bundle
composer require symfony/uid
composer require --dev doctrine/doctrine-fixtures-bundle
composer require --dev symfony/maker-bundle
```

### 2.2 Quitar lo que no usamos

Como esto es solo API, podemos quitar Twig:

```bash
composer remove twig
```

Si te da problemas porque hay una plantilla por ahí, déjalo: ocupa poco y no molesta.

---

## 3. Estructura de directorios

Tras seguir esta guía completa, el directorio `api/` quedará así. Ten esta referencia a mano:

```
api/
├── bin/
│   └── console
├── config/
│   ├── packages/
│   │   ├── doctrine.yaml
│   │   ├── lexik_jwt_authentication.yaml
│   │   ├── nelmio_cors.yaml
│   │   ├── security.yaml
│   │   └── validator.yaml
│   ├── routes.yaml
│   └── services.yaml
├── migrations/
│   └── Version20250315120000.php
├── public/
│   └── index.php
├── src/
│   ├── Controller/
│   │   ├── AuthController.php
│   │   ├── MeController.php
│   │   ├── UserController.php
│   │   ├── CentroController.php
│   │   ├── GradoController.php
│   │   ├── AsignaturaController.php
│   │   └── OfertaController.php
│   ├── DataFixtures/
│   │   └── AppFixtures.php
│   ├── Entity/
│   │   ├── User.php
│   │   ├── Centro.php
│   │   ├── Grado.php
│   │   ├── Asignatura.php
│   │   └── Oferta.php
│   ├── EventListener/
│   │   └── ExceptionListener.php
│   ├── Repository/
│   │   ├── UserRepository.php
│   │   ├── CentroRepository.php
│   │   ├── GradoRepository.php
│   │   ├── AsignaturaRepository.php
│   │   └── OfertaRepository.php
│   ├── Serializer/
│   │   └── ApiNormalizer.php
│   └── Kernel.php
├── var/
├── vendor/
├── .env
├── .env.local
└── composer.json
```

---

## 4. Configuración inicial

### 4.1 `.env.local`

Crea (o edita) `api/.env.local` con tus credenciales locales. Este archivo **no se commitea**. El `.env` sí, pero con valores placeholder.

```env
###> doctrine/doctrine-bundle ###
DATABASE_URL="mysql://root:@127.0.0.1:3306/auria?serverVersion=8.0&charset=utf8mb4"
###< doctrine/doctrine-bundle ###

###> symfony/framework-bundle ###
APP_ENV=dev
APP_SECRET=cambia_esto_por_una_cadena_aleatoria_larga
###< symfony/framework-bundle ###

###> lexik/jwt-authentication-bundle ###
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=cambia_esto_tambien
###< lexik/jwt-authentication-bundle ###

###> nelmio/cors-bundle ###
CORS_ALLOW_ORIGIN='^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$'
###< nelmio/cors-bundle ###
```

### 4.2 Crear la base de datos

```bash
php bin/console doctrine:database:create
```

Si todo va bien verás `Created database "auria"`. Si falla, comprueba que MySQL está corriendo y que las credenciales del `.env.local` son correctas.

### 4.3 Generar las claves JWT

```bash
php bin/console lexik:jwt:generate-keypair
```

Esto crea `config/jwt/private.pem` y `config/jwt/public.pem`. **Estas claves NO se commitean.** Asegúrate de que `config/jwt/` está en `.gitignore`.

Añade en `api/.gitignore` (al final):
```
/config/jwt/*.pem
```

---

## 5. Entidades (modelo)

Las entidades son las clases PHP que se mapean a tablas MySQL. Vamos a crearlas con sus relaciones y los grupos de serialización que controlan qué se devuelve en cada endpoint.

### 5.1 User — `src/Entity/User.php`

```php
<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'users')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['user:read', 'user:public', 'oferta:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 180, unique: true)]
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Groups(['user:read'])]
    private ?string $email = null;

    #[ORM\Column]
    private ?string $password = null;

    #[ORM\Column(length: 80)]
    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 80)]
    #[Groups(['user:read', 'user:public', 'oferta:read'])]
    private ?string $nombre = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['user:read', 'user:public', 'oferta:read'])]
    private ?string $foto = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'curso_actual_id', nullable: true)]
    private ?Asignatura $cursoActual = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Assert\Choice(choices: ['instagram', 'telefono', 'email'])]
    #[Groups(['user:read'])]
    private ?string $contactoPreferido = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['user:read'])]
    private ?string $contactoValor = null;

    #[ORM\Column]
    #[Groups(['user:read'])]
    private \DateTimeImmutable $createdAt;

    /** @var Collection<int, Oferta> */
    #[ORM\OneToMany(mappedBy: 'user', targetEntity: Oferta::class, orphanRemoval: true)]
    private Collection $ofertas;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->ofertas = new ArrayCollection();
    }

    // --- UserInterface ---

    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    public function getRoles(): array
    {
        return ['ROLE_USER'];
    }

    public function eraseCredentials(): void
    {
        // nada que hacer, no guardamos campos sensibles temporales
    }

    // --- Getters / setters ---

    public function getId(): ?int { return $this->id; }
    public function getEmail(): ?string { return $this->email; }
    public function setEmail(string $email): self { $this->email = $email; return $this; }
    public function getPassword(): ?string { return $this->password; }
    public function setPassword(string $password): self { $this->password = $password; return $this; }
    public function getNombre(): ?string { return $this->nombre; }
    public function setNombre(string $nombre): self { $this->nombre = $nombre; return $this; }
    public function getFoto(): ?string { return $this->foto; }
    public function setFoto(?string $foto): self { $this->foto = $foto; return $this; }
    public function getCursoActual(): ?Asignatura { return $this->cursoActual; }
    public function setCursoActual(?Asignatura $a): self { $this->cursoActual = $a; return $this; }
    public function getContactoPreferido(): ?string { return $this->contactoPreferido; }
    public function setContactoPreferido(?string $v): self { $this->contactoPreferido = $v; return $this; }
    public function getContactoValor(): ?string { return $this->contactoValor; }
    public function setContactoValor(?string $v): self { $this->contactoValor = $v; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getOfertas(): Collection { return $this->ofertas; }

    /**
     * Devuelve cursoActual con la forma del contrato:
     * { id: int, grado: string, curso: int } o null
     */
    #[Groups(['user:read', 'user:public', 'oferta:read'])]
    public function getCursoActualResumen(): ?array
    {
        if (!$this->cursoActual) return null;
        return [
            'id' => $this->cursoActual->getId(),
            'grado' => $this->cursoActual->getGrado()->getNombre(),
            'curso' => $this->cursoActual->getCurso(),
        ];
    }
}
```

### 5.2 Centro — `src/Entity/Centro.php`

```php
<?php

namespace App\Entity;

use App\Repository\CentroRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CentroRepository::class)]
#[ORM\Table(name: 'centros')]
class Centro
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['centro:read', 'grado:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    #[Groups(['centro:read', 'grado:read'])]
    private ?string $nombre = null;

    public function getId(): ?int { return $this->id; }
    public function getNombre(): ?string { return $this->nombre; }
    public function setNombre(string $nombre): self { $this->nombre = $nombre; return $this; }
}
```

### 5.3 Grado — `src/Entity/Grado.php`

```php
<?php

namespace App\Entity;

use App\Repository\GradoRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: GradoRepository::class)]
#[ORM\Table(name: 'grados')]
class Grado
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['grado:read', 'asignatura:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 60)]
    #[Assert\NotBlank]
    #[Groups(['grado:read', 'asignatura:read'])]
    private ?string $nombre = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['grado:read'])]
    private ?Centro $centro = null;

    public function getId(): ?int { return $this->id; }
    public function getNombre(): ?string { return $this->nombre; }
    public function setNombre(string $nombre): self { $this->nombre = $nombre; return $this; }
    public function getCentro(): ?Centro { return $this->centro; }
    public function setCentro(?Centro $c): self { $this->centro = $c; return $this; }
}
```

### 5.4 Asignatura — `src/Entity/Asignatura.php`

```php
<?php

namespace App\Entity;

use App\Repository\AsignaturaRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AsignaturaRepository::class)]
#[ORM\Table(name: 'asignaturas')]
class Asignatura
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['asignatura:read', 'oferta:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    #[Assert\NotBlank]
    #[Groups(['asignatura:read', 'oferta:read'])]
    private ?string $nombre = null;

    #[ORM\Column]
    #[Assert\Range(min: 1, max: 4)]
    #[Groups(['asignatura:read', 'oferta:read'])]
    private ?int $curso = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['asignatura:read', 'oferta:read'])]
    private ?Grado $grado = null;

    public function getId(): ?int { return $this->id; }
    public function getNombre(): ?string { return $this->nombre; }
    public function setNombre(string $nombre): self { $this->nombre = $nombre; return $this; }
    public function getCurso(): ?int { return $this->curso; }
    public function setCurso(int $curso): self { $this->curso = $curso; return $this; }
    public function getGrado(): ?Grado { return $this->grado; }
    public function setGrado(?Grado $g): self { $this->grado = $g; return $this; }
}
```

### 5.5 Oferta — `src/Entity/Oferta.php`

```php
<?php

namespace App\Entity;

use App\Repository\OfertaRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: OfertaRepository::class)]
#[ORM\Table(name: 'ofertas')]
#[ORM\UniqueConstraint(name: 'unique_user_asignatura', columns: ['user_id', 'asignatura_id'])]
class Oferta
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['oferta:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'ofertas')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['oferta:read'])]
    private ?User $user = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['oferta:read'])]
    private ?Asignatura $asignatura = null;

    #[ORM\Column(length: 200, nullable: true)]
    #[Assert\Length(max: 200)]
    #[Groups(['oferta:read'])]
    private ?string $descripcionCorta = null;

    #[ORM\Column]
    #[Groups(['oferta:read'])]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $u): self { $this->user = $u; return $this; }
    public function getAsignatura(): ?Asignatura { return $this->asignatura; }
    public function setAsignatura(?Asignatura $a): self { $this->asignatura = $a; return $this; }
    public function getDescripcionCorta(): ?string { return $this->descripcionCorta; }
    public function setDescripcionCorta(?string $d): self { $this->descripcionCorta = $d; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
```

### 5.6 Repositorios

Cuando creas las entidades, Symfony genera automáticamente los repositorios vacíos en `src/Repository/`. Vamos a añadir queries útiles solo donde haga falta.

**`src/Repository/OfertaRepository.php`** — añade estos métodos:

```php
public function buscarPorAsignatura(int $asignaturaId, ?int $excluyendoUserId = null): array
{
    $qb = $this->createQueryBuilder('o')
        ->andWhere('o.asignatura = :asig')
        ->setParameter('asig', $asignaturaId)
        ->orderBy('o.createdAt', 'DESC');

    if ($excluyendoUserId !== null) {
        $qb->andWhere('o.user != :uid')->setParameter('uid', $excluyendoUserId);
    }

    return $qb->getQuery()->getResult();
}

public function buscarPorGrado(int $gradoId, ?int $curso, ?int $excluyendoUserId = null): array
{
    $qb = $this->createQueryBuilder('o')
        ->join('o.asignatura', 'a')
        ->andWhere('a.grado = :grado')
        ->setParameter('grado', $gradoId)
        ->orderBy('o.createdAt', 'DESC');

    if ($curso !== null) {
        $qb->andWhere('a.curso = :curso')->setParameter('curso', $curso);
    }
    if ($excluyendoUserId !== null) {
        $qb->andWhere('o.user != :uid')->setParameter('uid', $excluyendoUserId);
    }

    return $qb->getQuery()->getResult();
}

public function existeOfertaDeUserParaAsignatura(int $userId, int $asignaturaId): bool
{
    return (bool) $this->createQueryBuilder('o')
        ->select('1')
        ->andWhere('o.user = :u AND o.asignatura = :a')
        ->setParameter('u', $userId)
        ->setParameter('a', $asignaturaId)
        ->getQuery()
        ->getOneOrNullResult();
}
```

---

## 6. Migraciones

Cada vez que cambias una entidad, generas una migración y la aplicas.

### 6.1 Generar la migración inicial

```bash
php bin/console make:migration
```

Esto crea un archivo en `migrations/VersionXXXXXXXXXXXXXX.php` con el SQL para crear las tablas.

### 6.2 Aplicar la migración

```bash
php bin/console doctrine:migrations:migrate
```

Confirma con `yes`. Verifica con tu cliente MySQL favorito que las tablas `users`, `centros`, `grados`, `asignaturas` y `ofertas` están creadas.

### 6.3 Si te equivocas y quieres empezar de cero (solo en desarrollo)

```bash
php bin/console doctrine:database:drop --force
php bin/console doctrine:database:create
rm migrations/Version*.php
php bin/console make:migration
php bin/console doctrine:migrations:migrate
```

---

## 7. Configurar JWT y Security

### 7.1 `config/packages/security.yaml`

Reemplaza el contenido con:

```yaml
security:
    password_hashers:
        Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface: 'auto'

    providers:
        app_user_provider:
            entity:
                class: App\Entity\User
                property: email

    firewalls:
        dev:
            pattern: ^/(_(profiler|wdt)|css|images|js)/
            security: false

        login:
            pattern: ^/api/auth/login
            stateless: true
            json_login:
                check_path: /api/auth/login
                username_path: email
                password_path: password
                success_handler: lexik_jwt_authentication.handler.authentication_success
                failure_handler: lexik_jwt_authentication.handler.authentication_failure

        register:
            pattern: ^/api/auth/register
            stateless: true
            security: false

        api:
            pattern: ^/api
            stateless: true
            jwt: ~

    access_control:
        - { path: ^/api/auth, roles: PUBLIC_ACCESS }
        - { path: ^/api, roles: ROLE_USER }
```

### 7.2 `config/packages/lexik_jwt_authentication.yaml`

Verifica que tiene este contenido (el bundle lo crea casi así):

```yaml
lexik_jwt_authentication:
    secret_key: '%env(resolve:JWT_SECRET_KEY)%'
    public_key: '%env(resolve:JWT_PUBLIC_KEY)%'
    pass_phrase: '%env(JWT_PASSPHRASE)%'
    token_ttl: 3600  # 1 hora
```

### 7.3 Custom success handler para login (importante)

Por defecto, LexikJWT solo devuelve `{ token: "..." }`. Nuestro contrato (sección 5.2 de ENDPOINTS.md) dice que el login devuelve también el `user`. Vamos a personalizarlo.

Crea **`src/EventListener/AuthenticationSuccessListener.php`**:

```php
<?php

namespace App\EventListener;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Symfony\Component\Serializer\SerializerInterface;

class AuthenticationSuccessListener
{
    public function __construct(private SerializerInterface $serializer) {}

    public function onAuthenticationSuccess(AuthenticationSuccessEvent $event): void
    {
        $data = $event->getData();
        $user = $event->getUser();

        if (!$user instanceof User) {
            return;
        }

        $userArray = json_decode(
            $this->serializer->serialize($user, 'json', ['groups' => 'user:read']),
            true
        );

        $data['user'] = $userArray;
        $event->setData($data);
    }
}
```

Y registra el listener en **`config/services.yaml`** (añade dentro de `services:`):

```yaml
    App\EventListener\AuthenticationSuccessListener:
        tags:
            - { name: kernel.event_listener, event: lexik_jwt_authentication.on_authentication_success, method: onAuthenticationSuccess }
```

---

## 8. Configurar CORS

### `config/packages/nelmio_cors.yaml`

```yaml
nelmio_cors:
    defaults:
        origin_regex: true
        allow_origin: ['%env(CORS_ALLOW_ORIGIN)%']
        allow_methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']
        allow_headers: ['Content-Type', 'Authorization', 'Accept']
        expose_headers: ['Link']
        max_age: 3600
    paths:
        '^/api/': null
```

El valor de `CORS_ALLOW_ORIGIN` está en `.env.local`. En producción se cambia para apuntar al dominio del frontend.

---

## 9. DTOs / Normalización de respuestas

El contrato dice que las respuestas siguen formatos concretos. La forma más limpia de cumplirlo es usar **grupos de serialización** (ya los hemos puesto como anotaciones `#[Groups(...)]` en las entidades).

### Grupos definidos

| Grupo | Para qué |
|---|---|
| `user:read` | Cuando devolvemos User completo (login, /me, PATCH) |
| `user:public` | Cuando aparece dentro de una Oferta o por GET /users/{id} |
| `oferta:read` | Estructura completa de Oferta |
| `centro:read` | Centro |
| `grado:read` | Grado con su centro |
| `asignatura:read` | Asignatura con su grado |

En cada controller, especificas qué grupo usar al serializar.

### Helper de respuestas — `src/Controller/ApiController.php`

Crea un controlador base del que extender para no repetir código:

```php
<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Serializer\SerializerInterface;

abstract class ApiController extends AbstractController
{
    public function __construct(protected SerializerInterface $serializer) {}

    protected function jsonGroup(mixed $data, array|string $groups, int $status = 200): JsonResponse
    {
        $groups = is_array($groups) ? $groups : [$groups];
        $json = $this->serializer->serialize($data, 'json', ['groups' => $groups]);

        return new JsonResponse($json, $status, [], true);
    }

    protected function jsonError(string $error, int $code, array $details = []): JsonResponse
    {
        return new JsonResponse([
            'error' => $error,
            'code' => $code,
            'details' => $details,
        ], $code);
    }
}
```

---

## 10. Controladores

Un controlador por recurso. Cada uno extiende `ApiController` para reutilizar los helpers.

### 10.1 AuthController — `src/Controller/AuthController.php`

```php
<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/auth')]
class AuthController extends ApiController
{
    #[Route('/register', methods: ['POST'])]
    public function register(
        Request $request,
        UserRepository $users,
        UserPasswordHasherInterface $hasher,
        ValidatorInterface $validator,
        EntityManagerInterface $em,
    ): JsonResponse {
        $data = json_decode($request->getContent(), true) ?? [];

        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';
        $nombre = trim($data['nombre'] ?? '');

        $details = [];
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $details[] = ['field' => 'email', 'message' => 'Email inválido'];
        }
        if (strlen($password) < 8) {
            $details[] = ['field' => 'password', 'message' => 'Mínimo 8 caracteres'];
        }
        if (strlen($nombre) < 2) {
            $details[] = ['field' => 'nombre', 'message' => 'Nombre demasiado corto'];
        }
        if ($details) {
            return $this->jsonError('Error de validación', 422, $details);
        }

        if ($users->findOneBy(['email' => $email])) {
            return $this->jsonError('Este email ya está en uso', 409);
        }

        $user = new User();
        $user->setEmail($email);
        $user->setNombre($nombre);
        $user->setPassword($hasher->hashPassword($user, $password));

        $em->persist($user);
        $em->flush();

        return $this->jsonGroup($user, 'user:read', 201);
    }

    // El login lo gestiona el firewall json_login + LexikJWT.
    // Esta ruta existe solo para que aparezca en docs y no la hace fallar el firewall.
    #[Route('/login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        // Nunca llega aquí: el firewall intercepta antes.
        return $this->jsonError('No debería llegar aquí', 500);
    }
}
```

### 10.2 MeController — `src/Controller/MeController.php`

```php
<?php

namespace App\Controller;

use App\Entity\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/me')]
class MeController extends ApiController
{
    #[Route('', methods: ['GET'])]
    public function me(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        return $this->jsonGroup($user, 'user:read');
    }
}
```

### 10.3 UserController — `src/Controller/UserController.php`

```php
<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\AsignaturaRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/users')]
class UserController extends ApiController
{
    #[Route('/{id<\d+>}', methods: ['GET'])]
    public function show(int $id, UserRepository $users): JsonResponse
    {
        $user = $users->find($id);
        if (!$user) return $this->jsonError('Usuario no encontrado', 404);

        return $this->jsonGroup($user, 'user:public');
    }

    #[Route('/{id<\d+>}/contacto', methods: ['GET'])]
    public function contacto(int $id, UserRepository $users): JsonResponse
    {
        $user = $users->find($id);
        if (!$user) return $this->jsonError('Usuario no encontrado', 404);

        if (!$user->getContactoPreferido() || !$user->getContactoValor()) {
            return $this->jsonError('Este usuario no ha configurado contacto', 404);
        }

        return new JsonResponse([
            'preferido' => $user->getContactoPreferido(),
            'valor' => $user->getContactoValor(),
        ]);
    }

    #[Route('/{id<\d+>}', methods: ['PATCH'])]
    public function update(
        int $id,
        Request $request,
        UserRepository $users,
        AsignaturaRepository $asignaturas,
        EntityManagerInterface $em,
    ): JsonResponse {
        $user = $users->find($id);
        if (!$user) return $this->jsonError('Usuario no encontrado', 404);

        if ($user !== $this->getUser()) {
            return $this->jsonError('No puedes editar otro usuario', 403);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $details = [];

        if (isset($data['nombre'])) {
            $nombre = trim($data['nombre']);
            if (strlen($nombre) < 2 || strlen($nombre) > 80) {
                $details[] = ['field' => 'nombre', 'message' => 'Nombre entre 2 y 80 caracteres'];
            } else {
                $user->setNombre($nombre);
            }
        }

        if (array_key_exists('foto', $data)) {
            $user->setFoto($data['foto'] ?: null);
        }

        if (isset($data['cursoActual'])) {
            $aid = $data['cursoActual']['asignaturaId'] ?? null;
            $asig = $aid ? $asignaturas->find($aid) : null;
            if ($aid && !$asig) {
                $details[] = ['field' => 'cursoActual', 'message' => 'Asignatura no encontrada'];
            } else {
                $user->setCursoActual($asig);
            }
        }

        if (isset($data['contactoPreferido'])) {
            if (!in_array($data['contactoPreferido'], ['instagram', 'telefono', 'email'], true)) {
                $details[] = ['field' => 'contactoPreferido', 'message' => 'Valor inválido'];
            } else {
                $user->setContactoPreferido($data['contactoPreferido']);
            }
        }

        if (array_key_exists('contactoValor', $data)) {
            $user->setContactoValor($data['contactoValor'] ?: null);
        }

        if ($details) return $this->jsonError('Error de validación', 422, $details);

        $em->flush();

        return $this->jsonGroup($user, 'user:read');
    }
}
```

### 10.4 CentroController — `src/Controller/CentroController.php`

```php
<?php

namespace App\Controller;

use App\Repository\CentroRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/centros')]
class CentroController extends ApiController
{
    #[Route('', methods: ['GET'])]
    public function list(CentroRepository $centros): JsonResponse
    {
        return $this->jsonGroup($centros->findAll(), 'centro:read');
    }
}
```

### 10.5 GradoController — `src/Controller/GradoController.php`

```php
<?php

namespace App\Controller;

use App\Repository\GradoRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/grados')]
class GradoController extends ApiController
{
    #[Route('', methods: ['GET'])]
    public function list(Request $request, GradoRepository $grados): JsonResponse
    {
        $criteria = [];
        if ($request->query->has('centro')) {
            $criteria['centro'] = (int) $request->query->get('centro');
        }

        $resultado = $grados->findBy($criteria, ['nombre' => 'ASC']);
        return $this->jsonGroup($resultado, 'grado:read');
    }
}
```

### 10.6 AsignaturaController — `src/Controller/AsignaturaController.php`

```php
<?php

namespace App\Controller;

use App\Repository\AsignaturaRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/asignaturas')]
class AsignaturaController extends ApiController
{
    #[Route('', methods: ['GET'])]
    public function list(Request $request, AsignaturaRepository $repo): JsonResponse
    {
        $criteria = [];
        if ($request->query->has('grado')) {
            $criteria['grado'] = (int) $request->query->get('grado');
        }
        if ($request->query->has('curso')) {
            $criteria['curso'] = (int) $request->query->get('curso');
        }

        $resultado = $repo->findBy($criteria, ['curso' => 'ASC', 'nombre' => 'ASC']);
        return $this->jsonGroup($resultado, 'asignatura:read');
    }
}
```

### 10.7 OfertaController — `src/Controller/OfertaController.php`

```php
<?php

namespace App\Controller;

use App\Entity\Oferta;
use App\Entity\User;
use App\Repository\AsignaturaRepository;
use App\Repository\OfertaRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/ofertas')]
class OfertaController extends ApiController
{
    #[Route('', methods: ['GET'])]
    public function search(Request $request, OfertaRepository $repo): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $excluyendo = $user->getId();

        if ($request->query->has('asignatura')) {
            $aid = (int) $request->query->get('asignatura');
            $resultado = $repo->buscarPorAsignatura($aid, $excluyendo);
        } elseif ($request->query->has('grado')) {
            $gid = (int) $request->query->get('grado');
            $curso = $request->query->has('curso') ? (int) $request->query->get('curso') : null;
            $resultado = $repo->buscarPorGrado($gid, $curso, $excluyendo);
        } else {
            return $this->jsonError('Falta filtro: asignatura o grado', 400);
        }

        return $this->jsonGroup($resultado, 'oferta:read');
    }

    #[Route('/me', methods: ['GET'])]
    public function mias(OfertaRepository $repo): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $resultado = $repo->findBy(['user' => $user], ['createdAt' => 'DESC']);
        return $this->jsonGroup($resultado, 'oferta:read');
    }

    #[Route('', methods: ['POST'])]
    public function create(
        Request $request,
        AsignaturaRepository $asignaturas,
        OfertaRepository $repo,
        EntityManagerInterface $em,
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true) ?? [];

        $aid = $data['asignaturaId'] ?? null;
        $desc = $data['descripcionCorta'] ?? null;

        $asig = $aid ? $asignaturas->find($aid) : null;
        if (!$asig) return $this->jsonError('Asignatura no encontrada', 404);

        if ($repo->existeOfertaDeUserParaAsignatura($user->getId(), $asig->getId())) {
            return $this->jsonError('Ya tienes una oferta para esta asignatura', 409);
        }

        if ($desc !== null && strlen($desc) > 200) {
            return $this->jsonError('Error de validación', 422, [
                ['field' => 'descripcionCorta', 'message' => 'Máximo 200 caracteres']
            ]);
        }

        $oferta = new Oferta();
        $oferta->setUser($user);
        $oferta->setAsignatura($asig);
        $oferta->setDescripcionCorta($desc);

        $em->persist($oferta);
        $em->flush();

        return $this->jsonGroup($oferta, 'oferta:read', 201);
    }

    #[Route('/{id<\d+>}', methods: ['DELETE'])]
    public function delete(int $id, OfertaRepository $repo, EntityManagerInterface $em): JsonResponse
    {
        $oferta = $repo->find($id);
        if (!$oferta) return $this->jsonError('Oferta no encontrada', 404);

        if ($oferta->getUser() !== $this->getUser()) {
            return $this->jsonError('No puedes eliminar ofertas de otros', 403);
        }

        $em->remove($oferta);
        $em->flush();

        return new JsonResponse(null, 204);
    }
}
```

---

## 11. Validación

Las validaciones más comunes ya están como anotaciones `#[Assert\...]` en las entidades. Para validaciones más complejas en los controllers, ya hemos visto el patrón: construir un array `$details` y devolver `422`.

---

## 12. Manejo global de errores

Para que cualquier excepción no controlada no devuelva HTML, registramos un listener.

### `src/EventListener/ExceptionListener.php`

```php
<?php

namespace App\EventListener;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class ExceptionListener
{
    public function onKernelException(ExceptionEvent $event): void
    {
        $request = $event->getRequest();
        // Solo intervenir en rutas /api
        if (!str_starts_with($request->getPathInfo(), '/api')) {
            return;
        }

        $exception = $event->getThrowable();
        $code = $exception instanceof HttpExceptionInterface
            ? $exception->getStatusCode()
            : 500;

        $response = new JsonResponse([
            'error' => $exception->getMessage() ?: 'Error interno',
            'code' => $code,
            'details' => [],
        ], $code);

        $event->setResponse($response);
    }
}
```

Y en `config/services.yaml`:

```yaml
    App\EventListener\ExceptionListener:
        tags:
            - { name: kernel.event_listener, event: kernel.exception, method: onKernelException }
```

---

## 13. Fixtures (datos de prueba)

### `src/DataFixtures/AppFixtures.php`

```php
<?php

namespace App\DataFixtures;

use App\Entity\Asignatura;
use App\Entity\Centro;
use App\Entity\Grado;
use App\Entity\Oferta;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(private UserPasswordHasherInterface $hasher) {}

    public function load(ObjectManager $em): void
    {
        // Centro
        $florida = new Centro();
        $florida->setNombre('Florida Universitària');
        $em->persist($florida);

        // Grados
        $daw = (new Grado())->setNombre('DAW')->setCentro($florida);
        $asir = (new Grado())->setNombre('ASIR')->setCentro($florida);
        $dam = (new Grado())->setNombre('DAM')->setCentro($florida);
        $em->persist($daw); $em->persist($asir); $em->persist($dam);

        // Asignaturas (ajustad con los nombres y cursos reales del centro)
        $asignaturas = [];
        foreach ([
            // [grado, curso, nombre]
            [$daw, 1, 'Programación'],
            [$daw, 1, 'Bases de Datos'],
            [$daw, 1, 'Lenguajes de Marcas'],
            [$daw, 2, 'Desarrollo Web Cliente'],
            [$daw, 2, 'Desarrollo Web Servidor'],
            [$asir, 1, 'Sistemas Operativos Monopuesto'],
            [$asir, 1, 'Redes Locales'],
            [$asir, 2, 'Administración de Sistemas'],
            [$dam, 1, 'Programación'],
            [$dam, 2, 'Acceso a Datos'],
            [$dam, 2, 'Programación Multimedia y Móviles'],
        ] as [$grado, $curso, $nombre]) {
            $a = (new Asignatura())->setGrado($grado)->setCurso($curso)->setNombre($nombre);
            $em->persist($a);
            $asignaturas[] = $a;
        }

        // Usuario de prueba
        $user = new User();
        $user->setEmail('demo@florida.edu');
        $user->setNombre('Demo User');
        $user->setPassword($this->hasher->hashPassword($user, 'demo1234'));
        $user->setContactoPreferido('instagram');
        $user->setContactoValor('@demouser');
        $em->persist($user);

        $em->flush();

        // Oferta de prueba
        $oferta = new Oferta();
        $oferta->setUser($user);
        $oferta->setAsignatura($asignaturas[0]);
        $oferta->setDescripcionCorta('Doy clases de Programación, contacta por Instagram');
        $em->persist($oferta);

        $em->flush();
    }
}
```

Cargar los datos:

```bash
php bin/console doctrine:fixtures:load --no-interaction
```

---

## 14. Arrancar y probar

### Arrancar el servidor

```bash
symfony serve
```

API disponible en `http://localhost:8000`.

### Pruebas con curl

**Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@florida.edu","password":"demo1234"}'
```

Te devuelve `{ token, user }`. Copia el token.

**Listar centros con el token:**
```bash
TOKEN="pega_aqui_el_token"
curl http://localhost:8000/api/centros -H "Authorization: Bearer $TOKEN"
```

**Crear una oferta:**
```bash
curl -X POST http://localhost:8000/api/ofertas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"asignaturaId":2,"descripcionCorta":"Repaso BBDD"}'
```

### Recomendación: Postman o Bruno

Para no estar todo el día con curl, monta una colección con todos los endpoints. Lo agradecerás cuando hagas la demo.

---

## 15. Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Unable to find the controller` | El controller no está bien anotado o falta el `use` | Revisa los `use Symfony\Component\Routing\Attribute\Route;` |
| `An exception occurred ... Access denied` | Credenciales MySQL mal en `.env.local` | Revisa el DATABASE_URL |
| `JWT Token not found` | Falta el header `Authorization: Bearer ...` | Añade el header en la petición |
| El login devuelve `{}` sin user | Falta registrar el `AuthenticationSuccessListener` | Verifica `services.yaml` |
| Las respuestas no incluyen relaciones (centro, grado…) | Falta el grupo en la relación | Añade `#[Groups(...)]` en la propiedad relacionada |
| Las claves JWT están commiteadas | `.gitignore` mal configurado | Borra del repo y añade a `.gitignore` |
| CORS bloqueado en frontend | Origen no permitido | Revisa `CORS_ALLOW_ORIGIN` en `.env.local` |
| `make:migration` dice "no changes" pero hay cambios | Cache | `php bin/console cache:clear` y vuelve a intentarlo |
| `409` siempre al crear oferta | Constraint único en BD | Revisa que no existe ya esa combinación user+asignatura |

---

## Checklist final del backend

Antes de dar por terminado el backend, comprueba:

- [ ] Las cinco entidades existen y tienen sus relaciones
- [ ] La migración inicial está aplicada
- [ ] Las fixtures cargan sin errores
- [ ] `POST /api/auth/register` crea un usuario
- [ ] `POST /api/auth/login` devuelve token + user
- [ ] `GET /api/me` con token devuelve el usuario
- [ ] `GET /api/centros` devuelve la lista
- [ ] `GET /api/grados?centro=1` filtra correctamente
- [ ] `GET /api/asignaturas?grado=1&curso=1` filtra correctamente
- [ ] `POST /api/ofertas` crea una oferta
- [ ] `GET /api/ofertas?asignatura=X` devuelve resultados sin incluir al usuario autenticado
- [ ] `DELETE /api/ofertas/{id}` no permite borrar ofertas ajenas (devuelve 403)
- [ ] CORS permite peticiones desde `http://localhost:4200`
- [ ] Las claves JWT NO están en el repositorio
- [ ] Todos los errores devuelven el formato `{ error, code, details }`

Cuando todo esté marcado, avisa al frontend para que empiece a integrar contra la API real.

---

_Si encuentras un comportamiento que no está documentado en `ENDPOINTS.md`, **no lo improvises**: discútelo con el frontend, actualizad el contrato y luego implementas. Es la única forma de evitar conflictos al integrar._
