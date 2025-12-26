--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: CartItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CartItem" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "productId" integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CartItem" OWNER TO postgres;

--
-- Name: CartItem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."CartItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."CartItem_id_seq" OWNER TO postgres;

--
-- Name: CartItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."CartItem_id_seq" OWNED BY public."CartItem".id;


--
-- Name: Faq; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Faq" (
    id integer NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Faq" OWNER TO postgres;

--
-- Name: Faq_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Faq_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Faq_id_seq" OWNER TO postgres;

--
-- Name: Faq_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Faq_id_seq" OWNED BY public."Faq".id;


--
-- Name: Order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Order" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "totalPrice" text NOT NULL,
    "contactInfo" text,
    "deliveryAddress" text,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Order" OWNER TO postgres;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderItem" (
    id integer NOT NULL,
    "orderId" integer NOT NULL,
    "productId" integer NOT NULL,
    quantity integer NOT NULL,
    price text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."OrderItem" OWNER TO postgres;

--
-- Name: OrderItem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."OrderItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."OrderItem_id_seq" OWNER TO postgres;

--
-- Name: OrderItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."OrderItem_id_seq" OWNED BY public."OrderItem".id;


--
-- Name: Order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Order_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Order_id_seq" OWNER TO postgres;

--
-- Name: Order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Order_id_seq" OWNED BY public."Order".id;


--
-- Name: Product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Product" (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    images text[],
    link text,
    price text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    category text
);


ALTER TABLE public."Product" OWNER TO postgres;

--
-- Name: Product_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Product_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Product_id_seq" OWNER TO postgres;

--
-- Name: Product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Product_id_seq" OWNED BY public."Product".id;


--
-- Name: Role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Role" (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public."Role" OWNER TO postgres;

--
-- Name: Role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Role_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Role_id_seq" OWNER TO postgres;

--
-- Name: Role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Role_id_seq" OWNED BY public."Role".id;


--
-- Name: SupportMessage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SupportMessage" (
    id integer NOT NULL,
    "ticketId" integer NOT NULL,
    "userId" integer NOT NULL,
    message text NOT NULL,
    photos text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SupportMessage" OWNER TO postgres;

--
-- Name: SupportMessage_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SupportMessage_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SupportMessage_id_seq" OWNER TO postgres;

--
-- Name: SupportMessage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SupportMessage_id_seq" OWNED BY public."SupportMessage".id;


--
-- Name: SupportTicket; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SupportTicket" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    subject text,
    "hasUnreadUserMessages" boolean DEFAULT false NOT NULL,
    "hasUnreadAdminMessages" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "closedAt" timestamp(3) without time zone
);


ALTER TABLE public."SupportTicket" OWNER TO postgres;

--
-- Name: SupportTicket_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SupportTicket_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SupportTicket_id_seq" OWNER TO postgres;

--
-- Name: SupportTicket_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SupportTicket_id_seq" OWNED BY public."SupportTicket".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    "tgId" text NOT NULL,
    "firstName" text,
    username text,
    "lastName" text,
    region text,
    phone text,
    "isBlocked" boolean DEFAULT false NOT NULL,
    "blockedAt" timestamp(3) without time zone,
    "blockedReason" text,
    "roleId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: UserProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserProfile" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "mseDate" timestamp(3) without time zone,
    "firstTsrDate" timestamp(3) without time zone,
    "tsrMethod" text,
    "tsrTypes" text,
    "tsrPeriodMonths" integer DEFAULT 3 NOT NULL,
    "nextTsrDate" timestamp(3) without time zone,
    "reminderDaysBefore" integer DEFAULT 21 NOT NULL,
    "lastReminderSent" timestamp(3) without time zone,
    "notificationsEnabled" boolean DEFAULT true NOT NULL,
    "additionalData" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserProfile" OWNER TO postgres;

--
-- Name: UserProfile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."UserProfile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."UserProfile_id_seq" OWNER TO postgres;

--
-- Name: UserProfile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."UserProfile_id_seq" OWNED BY public."UserProfile".id;


--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: CartItem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CartItem" ALTER COLUMN id SET DEFAULT nextval('public."CartItem_id_seq"'::regclass);


--
-- Name: Faq id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Faq" ALTER COLUMN id SET DEFAULT nextval('public."Faq_id_seq"'::regclass);


--
-- Name: Order id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order" ALTER COLUMN id SET DEFAULT nextval('public."Order_id_seq"'::regclass);


--
-- Name: OrderItem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem" ALTER COLUMN id SET DEFAULT nextval('public."OrderItem_id_seq"'::regclass);


--
-- Name: Product id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product" ALTER COLUMN id SET DEFAULT nextval('public."Product_id_seq"'::regclass);


--
-- Name: Role id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Role" ALTER COLUMN id SET DEFAULT nextval('public."Role_id_seq"'::regclass);


--
-- Name: SupportMessage id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportMessage" ALTER COLUMN id SET DEFAULT nextval('public."SupportMessage_id_seq"'::regclass);


--
-- Name: SupportTicket id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportTicket" ALTER COLUMN id SET DEFAULT nextval('public."SupportTicket_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Name: UserProfile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserProfile" ALTER COLUMN id SET DEFAULT nextval('public."UserProfile_id_seq"'::regclass);


--
-- Data for Name: CartItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CartItem" (id, "userId", "productId", quantity, "createdAt", "updatedAt") FROM stdin;
1	3	1	5	2025-12-19 22:57:02.442	2025-12-19 22:57:09.218
\.


--
-- Data for Name: Faq; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Faq" (id, question, answer, "createdAt", "updatedAt") FROM stdin;
2	вопрос 1	ответ 1	2025-12-18 14:44:52.455	2025-12-18 14:44:49.374
3	вопрос 2	ответ 2	2025-12-18 14:45:08.27	2025-12-18 14:45:10.1
4	Что такое электронный сертификат СФР?	Электронный сертификат (ЭС) — это не деньги на счёте и \nне бумажная справка, а уникальный цифровой документ, подтверждающий \nправо гражданина на получение технического средства реабилитации (ТСР) \nили услуги по его ремонту за счёт федерального бюджета. С 2023 года он \nстал основным механизмом обеспечения инвалидов и других льготников — \nвместо прямой выдачи ТСР со склада.\n\nБОЛЕЕ детально в нашем официальном блоге: https://sdmedik.ru/post/c74ebfec-f07d-4fd1-b141-b73bbc757975	2025-12-25 19:07:59.489	2025-12-25 19:07:59.489
5	Как воспользоваться электронным сертификатом для получения средств реабилитации?	Электронный сертификат — это целевые средства на индивидуальном счету получателя средств реабилитации. 🙅‍♂️Не\n получится воспользоваться этими деньгами в обычном магазине, снять их с\n карты или сделать перевод. \n✅Эти средства можно потратить строго в \nаккредитованных торговых магазинах, на средства прописанные в \nиндивидуальной программе реабилитации.  \nТрата в аккредитованных торгующих организациях – это дополнительная безопасность сделки. 🦾 И появляется возможность выбора производителя, выбора наиболее \nудобных условий получения. \n\nОфициальный аккредитованный интернет-магазин с выставочными залами и складами в разных регионах: https://sdmedik.ru/catalog/certificate\nМожно\nвыбрать самостоятельно, либо направить список и запрос в официальный \nчат сайта, либо написать в поддержку официального бота, здесь: \n\n\nБОЛЕЕ детально в нашем официальном блоге: https://clck.ru/3R2n59	2025-12-25 19:36:18.921	2025-12-25 19:38:43.328
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Order" (id, "userId", status, "totalPrice", "contactInfo", "deliveryAddress", comment, "createdAt", "updatedAt") FROM stdin;
1	2	pending	3000	+79510341677	Оренбург, самолётная 89	звонить заранее	2025-12-23 21:04:18.229	2025-12-23 21:04:18.229
2	5	pending	5	35	туда же	сами привезите	2025-12-25 20:54:38.512	2025-12-25 20:54:38.512
3	5	pending	100	898898	туда	\N	2025-12-25 21:11:35.94	2025-12-25 21:11:35.94
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderItem" (id, "orderId", "productId", quantity, price, "createdAt") FROM stdin;
1	1	1	1	3000	2025-12-23 21:04:18.229
2	2	2	5	1	2025-12-25 20:54:38.512
3	3	3	10	10	2025-12-25 21:11:35.94
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, name, description, images, link, price, "createdAt", "updatedAt", category) FROM stdin;
1	test	gdfsgfgdfgfd	{AgACAgIAAxkBAAIGJWlF2B4hbRoCazBPglonF1k9-_sjAAIZE2sbzasxSi9hD33OLfctAQADAgADeQADNgQ}	\N	3000	2025-12-19 22:56:41.877	2025-12-19 22:56:41.877	\N
2	Впитывающие простыни (пеленки) размером не менее 60 x 90 см (впитываемостью от 1200 до 1900 мл)	Одноразовые впитывающие пеленки, размер 60х90 см, в упаковке 30 шт; многослойная, гипоаллергенная основа.\n\n👉Подходят для приобретение по электронному сертификату СФР, а также за собственные средства безналичным и наличным рассчетом. \n\nДля покупки укажите в корзине чат-бота кол-во, способ оплаты и получения.  Либо самостоятельно оформите корзину на сайте sdmedik.ru, добавьте нужное кол-во.\n\n✅ На аккредитованном официальном сайте https://sdmedik.ru/ доступно приобретение по электронному сертификату Онлайн.\n Адреса ПВЗ указаны на сайте. \n🚀 По условия Бесплатной доставки уточняйте в чате поддержки.	{AgACAgIAAxkBAAIJeWlNodOb1N9umbRMR5nvf4N8eNT8AAI8DGsbXSNwSuW-BFqQZIVJAQADAgADeAADNgQ}	https://sdmedik.ru/product/certificate/f80e70a6-d353-463b-8907-14302745d5fc	1	2025-12-25 20:48:13.616	2025-12-25 20:48:13.616	пеленки
3	Подгузники для взрослых, размер "S" (объем талии/бедер до 90 см), с полным влагопоглощением не менее 1400г	Подгузники Senso Med, Размер S, в упаковке 30 шт, на липучках, повышенной впитываемости. Дышащий, гипоаллергенный материал.\n👉Подходят для приобретения по электронному сертификату СФР; и за собственные средства безналичным и наличным расчётом. \n\nДля покупки укажите в корзине чат-бота кол-во, способ оплаты и получения.  Либо самостоятельно оформите корзину на официальном сайте sdmedik.ru.\n\n✅ На аккредитованном официальном сайте sdmedik.ru доступно приобретение по электронному сертификату Онлайн.\n \nАдреса ПВЗ указаны на сайте. \n🚀 По условия Бесплатной доставки уточняйте в чате поддержки.	{AgACAgIAAxkBAAIJxWlNp3BXkDoPf5uGEjPAEiL-j8xHAAJXDGsbXSNwSrlibHyoxECnAQADAgADeAADNgQ}	https://clck.ru/3R2osU	10	2025-12-25 21:07:43.794	2025-12-25 21:07:43.794	Подгузники
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Role" (id, name) FROM stdin;
2	main admin
3	admin
4	support
1	user
\.


--
-- Data for Name: SupportMessage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SupportMessage" (id, "ticketId", "userId", message, photos, "createdAt") FROM stdin;
3	2	2	+79510341677	{}	2025-12-23 21:02:00.928
4	3	4	1	{}	2025-12-25 19:55:09.914
5	4	5	А как будет выглядеть чат?	{}	2025-12-25 19:56:25.95
6	4	4	ну вот так, переписька	{}	2025-12-25 19:56:37.372
7	3	4	что хотел?	{}	2025-12-25 19:57:01.997
8	3	4	нет оповещения от бота, что пришло сообщение	{}	2025-12-25 19:57:17.172
9	4	4	ываыв	{}	2025-12-25 19:57:39.237
10	4	5	У и	{}	2025-12-25 20:01:04.223
11	4	5	Опл	{}	2025-12-25 20:01:10.034
12	4	5	Ап	{}	2025-12-25 20:01:29.98
13	4	5	и вот	{}	2025-12-25 20:16:31.002
14	4	4	хорошо, что история сохранилась	{}	2025-12-25 20:17:12.411
\.


--
-- Data for Name: SupportTicket; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SupportTicket" (id, "userId", status, subject, "hasUnreadUserMessages", "hasUnreadAdminMessages", "createdAt", "updatedAt", "closedAt") FROM stdin;
3	4	closed	\N	f	t	2025-12-25 02:34:36.99	2025-12-25 20:01:58.446	2025-12-25 20:01:58.446
4	5	closed	\N	f	t	2025-12-25 19:54:17.58	2025-12-25 20:18:00.434	2025-12-25 20:18:00.433
2	2	open	\N	f	f	2025-12-18 14:38:15.081	2025-12-25 20:56:30.094	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, "tgId", "firstName", username, "lastName", region, phone, "isBlocked", "blockedAt", "blockedReason", "roleId", "createdAt", "updatedAt") FROM stdin;
2	8370051487	Максим	printbook77	Абелов	Оренбург	\N	f	\N	\N	1	2025-12-18 14:37:34.043	2025-12-18 14:37:37.878
3	916264231	Виталек	ciganit	\N	Оренбург	\N	f	\N	\N	3	2025-12-19 22:55:13.184	2025-12-19 22:55:18.065
4	906536330	Ант	PlanGus_PRmanager	\N	Краснодар	\N	f	\N	\N	3	2025-12-25 02:33:16.429	2025-12-25 02:33:32.941
5	7042953860	Puls chief manag	Puls5_chief	\N	Оренбург	\N	f	\N	\N	1	2025-12-25 19:44:27.237	2025-12-25 19:44:38.229
\.


--
-- Data for Name: UserProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserProfile" (id, "userId", "mseDate", "firstTsrDate", "tsrMethod", "tsrTypes", "tsrPeriodMonths", "nextTsrDate", "reminderDaysBefore", "lastReminderSent", "notificationsEnabled", "additionalData", "createdAt", "updatedAt") FROM stdin;
2	2	\N	\N	\N	\N	3	\N	21	\N	t	\N	2025-12-18 14:37:45.746	2025-12-18 14:37:45.746
3	3	\N	\N	\N	\N	3	\N	21	\N	t	\N	2025-12-19 22:55:25.086	2025-12-19 22:55:25.086
4	4	\N	\N	\N	\N	3	\N	21	\N	t	\N	2025-12-25 02:33:49.814	2025-12-25 02:33:49.814
5	5	1999-01-11 00:00:00	2008-11-11 00:00:00	сертификат	Трость, коляска, телевизор	3	2025-12-28 00:00:00	1	\N	t	\N	2025-12-25 19:45:02.483	2025-12-25 19:54:06.283
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
\.


--
-- Name: CartItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."CartItem_id_seq"', 4, true);


--
-- Name: Faq_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Faq_id_seq"', 5, true);


--
-- Name: OrderItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."OrderItem_id_seq"', 3, true);


--
-- Name: Order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Order_id_seq"', 3, true);


--
-- Name: Product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Product_id_seq"', 3, true);


--
-- Name: Role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Role_id_seq"', 4, true);


--
-- Name: SupportMessage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SupportMessage_id_seq"', 14, true);


--
-- Name: SupportTicket_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SupportTicket_id_seq"', 4, true);


--
-- Name: UserProfile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."UserProfile_id_seq"', 5, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 5, true);


--
-- Name: CartItem CartItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_pkey" PRIMARY KEY (id);


--
-- Name: Faq Faq_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Faq"
    ADD CONSTRAINT "Faq_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: SupportMessage SupportMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportMessage"
    ADD CONSTRAINT "SupportMessage_pkey" PRIMARY KEY (id);


--
-- Name: SupportTicket SupportTicket_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportTicket"
    ADD CONSTRAINT "SupportTicket_pkey" PRIMARY KEY (id);


--
-- Name: UserProfile UserProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserProfile"
    ADD CONSTRAINT "UserProfile_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: CartItem_userId_productId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CartItem_userId_productId_key" ON public."CartItem" USING btree ("userId", "productId");


--
-- Name: Faq_question_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Faq_question_key" ON public."Faq" USING btree (question);


--
-- Name: Role_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Role_name_key" ON public."Role" USING btree (name);


--
-- Name: UserProfile_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserProfile_userId_key" ON public."UserProfile" USING btree ("userId");


--
-- Name: User_tgId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_tgId_key" ON public."User" USING btree ("tgId");


--
-- Name: CartItem CartItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CartItem CartItem_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SupportMessage SupportMessage_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportMessage"
    ADD CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."SupportTicket"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SupportMessage SupportMessage_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportMessage"
    ADD CONSTRAINT "SupportMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SupportTicket SupportTicket_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportTicket"
    ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserProfile UserProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserProfile"
    ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--


