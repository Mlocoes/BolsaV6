--
-- PostgreSQL database dump
--

\restrict a9kMMAuuT8I0j9iSXaEqIntliTYFfJTKNrVnvmkmuCR2mkWeYId56A333tzDdYj

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

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
-- Name: transactiontype; Type: TYPE; Schema: public; Owner: bolsav7_user
--

CREATE TYPE public.transactiontype AS ENUM (
    'BUY',
    'SELL',
    'DIVIDEND',
    'SPLIT',
    'CORPORATE'
);


ALTER TYPE public.transactiontype OWNER TO bolsav7_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: bolsav7_user
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO bolsav7_user;

--
-- Name: assets; Type: TABLE; Schema: public; Owner: bolsav7_user
--

CREATE TABLE public.assets (
    id uuid NOT NULL,
    symbol character varying(20) NOT NULL,
    name character varying(255) NOT NULL,
    asset_type character varying(8) NOT NULL,
    currency character varying(10) NOT NULL,
    market character varying(50),
    sync_enabled boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.assets OWNER TO bolsav7_user;

--
-- Name: markets; Type: TABLE; Schema: public; Owner: bolsav7_user
--

CREATE TABLE public.markets (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    currency character varying(10) NOT NULL,
    country character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.markets OWNER TO bolsav7_user;

--
-- Name: portfolios; Type: TABLE; Schema: public; Owner: bolsav7_user
--

CREATE TABLE public.portfolios (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.portfolios OWNER TO bolsav7_user;

--
-- Name: quotes; Type: TABLE; Schema: public; Owner: bolsav7_user
--

CREATE TABLE public.quotes (
    id uuid NOT NULL,
    asset_id uuid NOT NULL,
    date timestamp with time zone NOT NULL,
    open numeric(18,6) NOT NULL,
    high numeric(18,6) NOT NULL,
    low numeric(18,6) NOT NULL,
    close numeric(18,6) NOT NULL,
    volume bigint,
    source character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.quotes OWNER TO bolsav7_user;

--
-- Name: results; Type: TABLE; Schema: public; Owner: bolsav7_user
--

CREATE TABLE public.results (
    id uuid NOT NULL,
    portfolio_id uuid NOT NULL,
    date date NOT NULL,
    total_value numeric(18,2) NOT NULL,
    invested_value numeric(18,2) NOT NULL,
    profit_loss numeric(18,2) NOT NULL,
    profit_loss_percent numeric(10,4) NOT NULL,
    positions_snapshot json NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.results OWNER TO bolsav7_user;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: bolsav7_user
--

CREATE TABLE public.transactions (
    id uuid NOT NULL,
    portfolio_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    transaction_type public.transactiontype NOT NULL,
    transaction_date timestamp with time zone NOT NULL,
    quantity numeric(18,6) NOT NULL,
    price numeric(18,6) NOT NULL,
    fees numeric(18,6),
    notes character varying(500),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.transactions OWNER TO bolsav7_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: bolsav7_user
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    is_active boolean NOT NULL,
    is_admin boolean NOT NULL,
    base_currency character varying(3) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO bolsav7_user;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: bolsav7_user
--

COPY public.alembic_version (version_num) FROM stdin;
606666a6bcbb
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: bolsav7_user
--

COPY public.assets (id, symbol, name, asset_type, currency, market, sync_enabled, created_at, updated_at) FROM stdin;
c188005b-ecc6-45ff-bf41-c6c3b7eb2df8	EURUSD=X	EUR/USD	CURRENCY	USD	FOREX	t	2025-12-29 16:53:09.261957+00	\N
fab3d2b8-d661-4df3-a9fe-f4f11b939973	EURGBP=X	EUR/GBP	CURRENCY	GBP	FOREX	t	2025-12-29 16:53:09.261957+00	\N
37106c9b-c475-431b-ba6d-260f945b5e40	EURJPY=X	EUR/JPY	CURRENCY	JPY	FOREX	t	2025-12-29 16:53:09.261957+00	\N
94d5f841-1943-4ada-a510-bc5e7802a372	EURCHF=X	EUR/CHF	CURRENCY	CHF	FOREX	t	2025-12-29 16:53:09.261957+00	\N
6a0526cf-12b3-471e-af18-69224d111ecb	EURCAD=X	EUR/CAD	CURRENCY	CAD	FOREX	t	2025-12-29 16:53:09.261957+00	\N
4e1f0467-374e-4724-a4e7-cc741d689abb	USDEUR=X	USD/EUR	CURRENCY	EUR	FOREX	t	2025-12-29 16:53:09.261957+00	\N
4b409fcd-c293-42d3-969c-29067ddd6d5d	USDGBP=X	USD/GBP	CURRENCY	GBP	FOREX	t	2025-12-29 16:53:09.261957+00	\N
eca0ffd4-c97b-45c1-bba5-371b6df06d80	USDJPY=X	USD/JPY	CURRENCY	JPY	FOREX	t	2025-12-29 16:53:09.261957+00	\N
7b71b880-17a3-4d6a-bf07-4ad9bd6dcc4c	USDCHF=X	USD/CHF	CURRENCY	CHF	FOREX	t	2025-12-29 16:53:09.261957+00	\N
0346bc12-e09f-404d-a069-fa782aa19359	USDCAD=X	USD/CAD	CURRENCY	CAD	FOREX	t	2025-12-29 16:53:09.261957+00	\N
adba9936-50ed-4221-b4e5-db3597afa326	GBPUSD=X	GBP/USD	CURRENCY	USD	FOREX	t	2025-12-29 16:53:09.261957+00	\N
8c5ddd7b-943e-4d91-84c4-b9d8d362cb4a	GBPEUR=X	GBP/EUR	CURRENCY	EUR	FOREX	t	2025-12-29 16:53:09.261957+00	\N
c8707b6b-d40d-46ba-a18c-9dbee4302adc	GBPJPY=X	GBP/JPY	CURRENCY	JPY	FOREX	t	2025-12-29 16:53:09.261957+00	\N
edc485eb-4642-489d-917d-e730041b66a5	CHFEUR=X	CHF/EUR	CURRENCY	EUR	FOREX	t	2025-12-29 16:53:09.261957+00	\N
63bd20bc-df2f-467b-8a96-b8e67fd3e54f	CHFUSD=X	CHF/USD	CURRENCY	USD	FOREX	t	2025-12-29 16:53:09.261957+00	\N
d96450ff-ffc6-4262-a308-39219c0d5179	CADEUR=X	CAD/EUR	CURRENCY	EUR	FOREX	t	2025-12-29 16:53:09.261957+00	\N
fb08b605-365c-4d92-a72a-f2503a5f38bb	CADUSD=X	CAD/USD	CURRENCY	USD	FOREX	t	2025-12-29 16:53:09.261957+00	\N
b7ab6aaf-f985-4692-ae75-95a654d1aaf8	JPYEUR=X	JPY/EUR	CURRENCY	EUR	FOREX	t	2025-12-29 16:53:09.261957+00	\N
43c3d9d8-3527-49ab-b25e-ca99b68a9b36	JPYUSD=X	JPY/USD	CURRENCY	USD	FOREX	t	2025-12-29 16:53:09.261957+00	\N
d67eec6f-8910-49f9-8ecb-c73edc8bac93	AGAE	ALLIED GAMING & E	STOCK	USD	NASDAQ	t	2025-12-29 16:54:31.197624+00	\N
0fc24c05-1b0f-42e1-833f-597c0916e4ee	MSTR	MICROSTRATEGY INC	STOCK	USD	NASDAQ	t	2025-12-29 16:54:31.197624+00	\N
d16bccd0-5951-479e-8376-5fd876d73395	TSLA	TESLA MOTORS INC	STOCK	USD	NASDAQ	t	2025-12-29 16:54:31.197624+00	\N
60d0d8a5-b85e-43a0-815a-db98f8560a8e	PLTR	PALANTIR TECHNOLO	STOCK	USD	NASDAQ	t	2025-12-29 16:54:31.197624+00	\N
f2f9a893-992a-4c0f-aafc-c517e78a1d3b	NVDA	NVIDIA CORP	STOCK	USD	NASDAQ	t	2025-12-29 16:54:31.197624+00	\N
2fde9ac4-0013-45fc-b0b8-1cf5d596e773	UMAC	UNUSUAL MACHINES	STOCK	USD	NEW YORK	t	2025-12-29 16:54:31.197624+00	\N
207d3e06-99b8-4b52-ab56-81e11324ecec	GRRR	GORILLA TECHNOLOG	STOCK	USD	NASDAQ	t	2025-12-29 16:54:31.197624+00	\N
0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	NVD.DE	NVIDIA CORP	STOCK	EUR	XETRA US STARS	t	2025-12-29 16:54:31.197624+00	\N
1da95179-4b3b-4945-9da3-8328e7dd3787	TLO.DE	TESLA MOTOR	STOCK	EUR	XETRA	t	2025-12-29 16:54:31.197624+00	\N
eb98c06a-985b-4bba-80b8-99dd23bc10dc	AGEXTHCVR03/24	AGEX TH CVR 03/24	STOCK	USD	NEW YORK	t	2025-12-29 16:54:31.197624+00	\N
09c50649-005b-424e-a047-3798e057b20e	VANA.MC	VANADI COFFEE	STOCK	EUR	CONTINUO	t	2025-12-29 16:54:31.197624+00	\N
85c79f2c-3f6c-47f9-b04e-e1d793e01a17	SIRI	SIRIUS XM HOLDING	STOCK	USD	NASDAQ	t	2025-12-29 16:54:31.197624+00	\N
647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	NIKOLAORD	NIKOLA ORD	STOCK	USD	NASDAQ	t	2025-12-29 16:54:31.197624+00	\N
55818ddf-5e1e-4c90-bec0-df2ca999fc7c	IAG.MC	IAG	STOCK	EUR	CONTINUO	t	2025-12-29 16:54:31.197624+00	\N
424e567b-b2f1-4f80-a170-d20e5e3314ee	DIA.MC	DIA	STOCK	EUR	CONTINUO	t	2025-12-29 16:54:31.197624+00	\N
c422c047-5282-41e2-ba3d-244aeb727f6b	NYE.MC	NYESA VALORES COR	STOCK	EUR	CONTINUO	t	2025-12-29 16:54:31.197624+00	\N
eee809be-2422-467e-8065-4b92aea15f0b	RIVN	RIVIAN AUTOMOTIVE	STOCK	USD	NASDAQ	t	2025-12-29 16:54:31.197624+00	\N
dfa15de8-2d25-41b1-b674-1e4a4dd051e8	SER	SERINA THERAPEUTI	STOCK	USD	NEW YORK	t	2025-12-29 16:54:31.197624+00	\N
a7df7a83-c480-40ba-964a-8668e7d66e85	AGEXTHERAPEUTICS	AGEX THERAPEUTICS	STOCK	USD	NEW YORK	t	2025-12-29 16:54:31.197624+00	\N
d6a3d125-47a7-4f74-8853-7920ed6b1423	COIN	COINBASE GLOBAL	STOCK	USD	NASDAQ	t	2025-12-29 16:54:31.197624+00	\N
16906ad0-055b-4011-b0fa-1f43605a18b8	GOOGL	ALPHABET INC CL A	STOCK	USD	NASDAQ	t	2025-12-29 16:54:31.197624+00	\N
e970be1b-915c-4613-825f-1863d362fd14	NIO	NIO INC	STOCK	USD	NEW YORK	t	2025-12-29 16:54:31.197624+00	\N
6e713866-b5d0-4b0e-b925-5fc1e6d02002	XPEV	XPENG INC	STOCK	USD	NEW YORK	t	2025-12-29 16:54:31.197624+00	\N
d86b8d27-28f3-4642-b10f-1d4a06c25a1b	BEDBATH	BED BATH	STOCK	USD	NASDAQ	t	2025-12-29 16:54:31.197624+00	\N
85dd7271-ab8a-4157-b3a4-fa44aa509421	SAN.MC	BANCO SANTANDER	STOCK	EUR	CONTINUO	t	2025-12-29 16:54:31.197624+00	\N
\.


--
-- Data for Name: markets; Type: TABLE DATA; Schema: public; Owner: bolsav7_user
--

COPY public.markets (id, name, currency, country, created_at, updated_at) FROM stdin;
b2fc6272-d161-456f-93b0-bb0cc1e75af8	NASDAQ	USD	USA	2025-12-29 16:53:09.232411+00	\N
5761ddf7-1774-4892-910b-ebe46e5503cb	NYSE	USD	USA	2025-12-29 16:53:09.232411+00	\N
77ed7b0c-142b-4f95-a6ca-fbf004ad0691	NEW YORK	USD	USA	2025-12-29 16:53:09.232411+00	\N
a5d57b09-dcb6-4ecd-ab6c-3d55c8244ce4	NYSE AMERICAN	USD	USA	2025-12-29 16:53:09.232411+00	\N
e0b172bb-5eaa-4783-83d1-3a335cea2ee3	CONTINUO	EUR	ESPAÑA	2025-12-29 16:53:09.232411+00	\N
08e604e3-24f2-4532-8c87-fa1b638f7339	MCE	EUR	ESPAÑA	2025-12-29 16:53:09.232411+00	\N
b0310b3a-8d3f-4bd3-952a-cb3d1c997417	XETRA	EUR	ALEMANIA	2025-12-29 16:53:09.232411+00	\N
c03f07db-3cb9-4d60-a5ef-9ff8b0c3966b	XETRA US STARS	EUR	ALEMANIA	2025-12-29 16:53:09.232411+00	\N
3aca927b-4f2f-4371-84e3-d271a6299e6c	FRANKFURT	EUR	ALEMANIA	2025-12-29 16:53:09.232411+00	\N
ac1ccf80-0a99-49ed-bb18-015874232b50	PARIS	EUR	FRANCIA	2025-12-29 16:53:09.232411+00	\N
b242f580-f919-470b-b441-7401ce41822c	MILAN	EUR	ITALIA	2025-12-29 16:53:09.232411+00	\N
947c24cb-abb1-4a79-8cb9-04850c7ff49e	AMSTERDAM	EUR	HOLANDA	2025-12-29 16:53:09.232411+00	\N
8ad680c6-5fff-45ec-9ed0-a9c15d16566c	LSE	GBP	REINO UNIDO	2025-12-29 16:53:09.232411+00	\N
70af1532-2257-4a0e-9ec3-91b6edb0b617	LONDON	GBP	REINO UNIDO	2025-12-29 16:53:09.232411+00	\N
5204a22a-9550-4a96-9010-715276e28b80	SWX	CHF	SUIZA	2025-12-29 16:53:09.232411+00	\N
09e41200-b3ba-4a04-8299-69b33b60ad03	TORONTO	CAD	CANADÁ	2025-12-29 16:53:09.232411+00	\N
\.


--
-- Data for Name: portfolios; Type: TABLE DATA; Schema: public; Owner: bolsav7_user
--

COPY public.portfolios (id, user_id, name, description, created_at, updated_at) FROM stdin;
ef16e018-8e81-4ac6-933d-3fd911dd372c	b5e93c28-df8a-45a9-8d32-077649412987	Bolsa		2025-12-29 16:53:57.388503+00	\N
\.


--
-- Data for Name: quotes; Type: TABLE DATA; Schema: public; Owner: bolsav7_user
--

COPY public.quotes (id, asset_id, date, open, high, low, close, volume, source, created_at) FROM stdin;
df7881fe-1938-4995-90dd-7468cae54c8a	c188005b-ecc6-45ff-bf41-c6c3b7eb2df8	2025-12-29 00:00:00+00	1.177700	1.179200	1.175800	1.176300	0	yfinance_auto	2025-12-29 16:55:20.586336+00
f6b9997f-51e6-4d4b-9c51-261bb25b1602	fab3d2b8-d661-4df3-a9fe-f4f11b939973	2025-12-29 00:00:00+00	0.872100	0.874000	0.871000	0.871400	0	yfinance_auto	2025-12-29 16:55:20.586336+00
d0c89e42-fab5-4a8f-88ef-b182b5076b01	37106c9b-c475-431b-ba6d-260f945b5e40	2025-12-29 00:00:00+00	184.334000	184.415000	183.430000	183.614000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
070f3017-5294-4636-a8a9-0d8ee3bd6a99	94d5f841-1943-4ada-a510-bc5e7802a372	2025-12-29 00:00:00+00	0.929100	0.930800	0.927700	0.928700	0	yfinance_auto	2025-12-29 16:55:20.586336+00
c9539733-dba6-4232-95ae-c63d6b8248dc	6a0526cf-12b3-471e-af18-69224d111ecb	2025-12-29 00:00:00+00	1.609100	1.613600	1.606600	1.608900	0	yfinance_auto	2025-12-29 16:55:20.586336+00
51bea9b0-0f8a-431d-837b-a3d328974f29	4e1f0467-374e-4724-a4e7-cc741d689abb	2025-12-29 00:00:00+00	0.849100	0.850500	0.848000	0.850100	0	yfinance_auto	2025-12-29 16:55:20.586336+00
4699f470-263f-441f-85e2-096cc60e1acb	4b409fcd-c293-42d3-969c-29067ddd6d5d	2025-12-29 00:00:00+00	0.740800	0.742300	0.740100	0.740900	0	yfinance_auto	2025-12-29 16:55:20.586336+00
31b701ae-5f19-409e-8d81-5cfbf47f5cf4	eca0ffd4-c97b-45c1-bba5-371b6df06d80	2025-12-29 00:00:00+00	156.558000	156.555000	155.910000	156.080000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
60064643-cb1f-4836-8081-40aa7a5cf318	7b71b880-17a3-4d6a-bf07-4ad9bd6dcc4c	2025-12-29 00:00:00+00	0.789400	0.791600	0.787300	0.789700	0	yfinance_auto	2025-12-29 16:55:20.586336+00
5c80babd-73a5-4a4d-9dbf-4e71c8ef356e	0346bc12-e09f-404d-a069-fa782aa19359	2025-12-29 00:00:00+00	1.367000	1.370100	1.365300	1.368100	0	yfinance_auto	2025-12-29 16:55:20.586336+00
78e528a9-a576-4f3b-96f0-9ac6f2cae957	adba9936-50ed-4221-b4e5-db3597afa326	2025-12-29 00:00:00+00	1.349900	1.351200	1.347100	1.349600	0	yfinance_auto	2025-12-29 16:55:20.586336+00
5d9cdd76-a17a-4b39-b752-153653c6ff0e	8c5ddd7b-943e-4d91-84c4-b9d8d362cb4a	2025-12-29 00:00:00+00	1.146200	1.147500	1.143800	1.147000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
e5a3af0d-d24f-4e4d-aa60-11ab3d18b661	c8707b6b-d40d-46ba-a18c-9dbee4302adc	2025-12-29 00:00:00+00	211.367000	211.404000	210.428000	210.651000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
8443161b-0ed0-4989-bf3e-1f64f2504d18	edc485eb-4642-489d-917d-e730041b66a5	2025-12-29 00:00:00+00	1.075200	1.076900	1.073900	1.076200	0	yfinance_auto	2025-12-29 16:55:20.586336+00
0740e68b-c2f3-484f-b2ab-744d8e85434f	63bd20bc-df2f-467b-8a96-b8e67fd3e54f	2025-12-29 00:00:00+00	1.266800	1.270200	1.263300	1.266300	0	yfinance_auto	2025-12-29 16:55:20.586336+00
e997e9cc-07bf-42ec-a4c8-252a1260f3f7	d96450ff-ffc6-4262-a308-39219c0d5179	2025-12-29 00:00:00+00	0.621000	0.622000	0.619500	0.621300	0	yfinance_auto	2025-12-29 16:55:20.586336+00
d0915b5a-77c6-4b7a-909d-1fd5392e2969	fb08b605-365c-4d92-a72a-f2503a5f38bb	2025-12-29 00:00:00+00	0.731500	0.732400	0.729900	0.730900	0	yfinance_auto	2025-12-29 16:55:20.586336+00
7eda93c7-d00e-4241-98fd-99e9d70281d7	b7ab6aaf-f985-4692-ae75-95a654d1aaf8	2025-12-29 00:00:00+00	0.005400	0.005500	0.005400	0.005400	0	yfinance_auto	2025-12-29 16:55:20.586336+00
7da4a43f-7863-4a31-a5ba-cc1452f6f267	43c3d9d8-3527-49ab-b25e-ca99b68a9b36	2025-12-29 00:00:00+00	0.006400	0.006400	0.006400	0.006400	0	yfinance_auto	2025-12-29 16:55:20.586336+00
c8bb19bb-6510-448f-a16b-6fc2dce08bff	d67eec6f-8910-49f9-8ecb-c73edc8bac93	2025-12-29 00:00:00+00	0.430900	0.491400	0.410000	0.474100	0	yfinance_auto	2025-12-29 16:55:20.586336+00
0bfaea3a-f2a7-4ed5-bd5f-8c27720cb036	0fc24c05-1b0f-42e1-833f-597c0916e4ee	2025-12-29 00:00:00+00	158.810000	162.930000	156.820000	156.890000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
1c345be5-fe87-4472-9173-144d6c6182f7	d16bccd0-5951-479e-8376-5fd876d73395	2025-12-29 00:00:00+00	475.190000	469.400000	461.320000	468.340000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
2a2e27ad-d6ea-4777-bf39-3d256970b4a2	60d0d8a5-b85e-43a0-815a-db98f8560a8e	2025-12-29 00:00:00+00	188.710000	187.200000	183.640000	186.625000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
449b0e69-617a-41d0-bb82-e1e22c3082d9	f2f9a893-992a-4c0f-aafc-c517e78a1d3b	2025-12-29 00:00:00+00	190.530000	188.755000	185.910000	187.510000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
46194c7c-c773-4a1d-92db-7ebe0e03c9f4	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	2025-12-29 00:00:00+00	12.210000	12.330000	11.660000	11.855000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
0639aff3-c5e9-4ad8-a98d-abe868a69cf8	207d3e06-99b8-4b52-ab56-81e11324ecec	2025-12-29 00:00:00+00	11.260000	11.610000	10.900000	11.360000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
89e9c898-eeef-4255-9f04-85be0009a5f6	0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	2025-12-29 00:00:00+00	159.320000	161.120000	157.940000	159.280000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
1089b3b9-0ec9-428b-98fa-2338a237af25	09c50649-005b-424e-a047-3798e057b20e	2025-12-29 00:00:00+00	0.183000	0.184000	0.166000	0.166000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
31fe521e-fc91-4c6e-8f54-3a6c3af8b7a6	85c79f2c-3f6c-47f9-b04e-e1d793e01a17	2025-12-29 00:00:00+00	20.600000	20.605000	20.200000	20.465000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
11239d0d-11ae-42ea-95da-4f2e8516c45b	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	2025-12-29 00:00:00+00	4.779000	4.780000	4.713000	4.750000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
e4d57152-21b9-408e-85f8-dd0df95cadb9	424e567b-b2f1-4f80-a170-d20e5e3314ee	2025-12-29 00:00:00+00	36.650000	36.950000	35.500000	36.950000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
ea2057c3-23be-4d23-8148-263779d00895	c422c047-5282-41e2-ba3d-244aeb727f6b	2025-12-29 00:00:00+00	0.007600	0.007800	0.007400	0.007600	0	yfinance_auto	2025-12-29 16:55:20.586336+00
1f5cc687-00b8-4fbd-b0e9-25d175b007b6	eee809be-2422-467e-8065-4b92aea15f0b	2025-12-29 00:00:00+00	20.900000	21.040000	20.330000	20.975000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
71c0b491-0e9b-4436-9059-9684aa421c9e	dfa15de8-2d25-41b1-b674-1e4a4dd051e8	2025-12-29 00:00:00+00	2.660000	2.750000	2.474000	2.531000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
455f42fb-6dfa-4767-af2b-fb39d9e57efa	d6a3d125-47a7-4f74-8853-7920ed6b1423	2025-12-29 00:00:00+00	236.900000	239.890000	232.920000	233.360000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
6f946443-15dd-4ab8-b356-a840ce46e206	16906ad0-055b-4011-b0fa-1f43605a18b8	2025-12-29 00:00:00+00	313.510000	313.440000	310.650000	311.825000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
f3566f65-b05b-458a-b298-3e7822e2f4c4	e970be1b-915c-4613-825f-1863d362fd14	2025-12-29 00:00:00+00	5.100000	5.318000	5.080000	5.275000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
1a176ba1-ce64-420d-8ff2-e3d6effbcdad	6e713866-b5d0-4b0e-b925-5fc1e6d02002	2025-12-29 00:00:00+00	20.780000	20.590000	20.050000	20.500000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
fd415d70-4f44-4e19-a042-744e703cacbc	85dd7271-ab8a-4157-b3a4-fa44aa509421	2025-12-29 00:00:00+00	9.989000	10.036000	9.950000	9.966000	0	yfinance_auto	2025-12-29 16:55:20.586336+00
\.


--
-- Data for Name: results; Type: TABLE DATA; Schema: public; Owner: bolsav7_user
--

COPY public.results (id, portfolio_id, date, total_value, invested_value, profit_loss, profit_loss_percent, positions_snapshot, created_at) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: bolsav7_user
--

COPY public.transactions (id, portfolio_id, asset_id, transaction_type, transaction_date, quantity, price, fees, notes, created_at, updated_at) FROM stdin;
1415ddc1-ced9-43d7-9efb-80586b01319f	ef16e018-8e81-4ac6-933d-3fd911dd372c	d67eec6f-8910-49f9-8ecb-c73edc8bac93	BUY	2025-12-09 00:00:00+00	100.000000	0.370000	23.290000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008678056 | Efectivo: 60.29	2025-12-29 16:54:31.197624+00	\N
436f1578-7627-498a-84cb-6a0341b82d35	ef16e018-8e81-4ac6-933d-3fd911dd372c	d67eec6f-8910-49f9-8ecb-c73edc8bac93	BUY	2025-12-09 00:00:00+00	200.000000	0.370000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008678056 | Efectivo: 74.0	2025-12-29 16:54:31.197624+00	\N
98187223-d11a-4fa0-a791-7e144627e42b	ef16e018-8e81-4ac6-933d-3fd911dd372c	d67eec6f-8910-49f9-8ecb-c73edc8bac93	BUY	2025-12-09 00:00:00+00	100.000000	0.370000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008678056 | Efectivo: 37.0	2025-12-29 16:54:31.197624+00	\N
1ea46434-dff2-4693-a6d1-47e760f584a2	ef16e018-8e81-4ac6-933d-3fd911dd372c	d67eec6f-8910-49f9-8ecb-c73edc8bac93	BUY	2025-12-09 00:00:00+00	100.000000	0.370000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008678056 | Efectivo: 37.0	2025-12-29 16:54:31.197624+00	\N
7118f7b3-0c66-4c60-ae8f-ad735dffb876	ef16e018-8e81-4ac6-933d-3fd911dd372c	d67eec6f-8910-49f9-8ecb-c73edc8bac93	BUY	2025-12-09 00:00:00+00	600.000000	0.370000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008678056 | Efectivo: 222.0	2025-12-29 16:54:31.197624+00	\N
67f31090-ecc0-48fe-859c-755e0e7893d9	ef16e018-8e81-4ac6-933d-3fd911dd372c	d67eec6f-8910-49f9-8ecb-c73edc8bac93	BUY	2025-12-09 00:00:00+00	100.000000	0.370000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008678056 | Efectivo: 37.0	2025-12-29 16:54:31.197624+00	\N
5d50b394-9aef-4edd-83b2-1472d8c17c7f	ef16e018-8e81-4ac6-933d-3fd911dd372c	d67eec6f-8910-49f9-8ecb-c73edc8bac93	BUY	2025-12-09 00:00:00+00	100.000000	0.370000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008678056 | Efectivo: 37.0	2025-12-29 16:54:31.197624+00	\N
ffd454be-aae3-4e6b-9ca2-381a030f6926	ef16e018-8e81-4ac6-933d-3fd911dd372c	d67eec6f-8910-49f9-8ecb-c73edc8bac93	BUY	2025-12-09 00:00:00+00	400.000000	0.370000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008678056 | Efectivo: 148.0	2025-12-29 16:54:31.197624+00	\N
ded39b6a-9efb-4270-9670-9d731b0ec60a	ef16e018-8e81-4ac6-933d-3fd911dd372c	d67eec6f-8910-49f9-8ecb-c73edc8bac93	BUY	2025-12-09 00:00:00+00	100.000000	0.370000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008678056 | Efectivo: 37.0	2025-12-29 16:54:31.197624+00	\N
2d5d991e-a80c-4653-bc1d-83750ec4cb0a	ef16e018-8e81-4ac6-933d-3fd911dd372c	d67eec6f-8910-49f9-8ecb-c73edc8bac93	BUY	2025-12-09 00:00:00+00	100.000000	0.370000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008678056 | Efectivo: 37.0	2025-12-29 16:54:31.197624+00	\N
4efcb635-c7cb-4de3-9a2d-e176a46663b1	ef16e018-8e81-4ac6-933d-3fd911dd372c	d67eec6f-8910-49f9-8ecb-c73edc8bac93	BUY	2025-12-09 00:00:00+00	100.000000	0.370000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008678056 | Efectivo: 37.0	2025-12-29 16:54:31.197624+00	\N
d026aa2d-c5b5-4ede-b046-ebd4db6c416d	ef16e018-8e81-4ac6-933d-3fd911dd372c	0fc24c05-1b0f-42e1-833f-597c0916e4ee	BUY	2025-12-02 00:00:00+00	50.000000	185.350000	23.220000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008666078 | Efectivo: 9290.7	2025-12-29 16:54:31.197624+00	\N
70c1660e-d69f-46b8-ad0e-94e3faf35e68	ef16e018-8e81-4ac6-933d-3fd911dd372c	d16bccd0-5951-479e-8376-5fd876d73395	BUY	2025-11-20 00:00:00+00	10.000000	419.000000	23.010000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008644171 | Efectivo: 4213.01	2025-12-29 16:54:31.197624+00	\N
296b19f4-6878-42c1-b4c1-c6b1cd8b0e35	ef16e018-8e81-4ac6-933d-3fd911dd372c	d16bccd0-5951-479e-8376-5fd876d73395	BUY	2025-11-20 00:00:00+00	40.000000	419.000000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008644171 | Efectivo: 16760.0	2025-12-29 16:54:31.197624+00	\N
e635932b-e788-43c6-a637-ddae3536fc27	ef16e018-8e81-4ac6-933d-3fd911dd372c	60d0d8a5-b85e-43a0-815a-db98f8560a8e	BUY	2025-11-20 00:00:00+00	100.000000	173.000000	23.010000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008644138 | Efectivo: 17323.01	2025-12-29 16:54:31.197624+00	\N
d282da9e-07a4-4643-8476-8058dcf3e23f	ef16e018-8e81-4ac6-933d-3fd911dd372c	f2f9a893-992a-4c0f-aafc-c517e78a1d3b	BUY	2025-11-20 00:00:00+00	100.000000	193.000000	23.010000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008644205 | Efectivo: 19323.01	2025-12-29 16:54:31.197624+00	\N
46b422ca-1b51-43dd-b4d7-223b91ca7f86	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-11-20 00:00:00+00	100.000000	8.950000	23.010000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008644386 | Efectivo: 918.01	2025-12-29 16:54:31.197624+00	\N
544dff9b-0c2e-457a-b0c6-596a6778c976	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-11-20 00:00:00+00	100.000000	8.950000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008644386 | Efectivo: 895.0	2025-12-29 16:54:31.197624+00	\N
76f460d5-3a46-48a8-a261-3d61773c4fa8	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-11-20 00:00:00+00	100.000000	8.950000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008644386 | Efectivo: 895.0	2025-12-29 16:54:31.197624+00	\N
155357fd-35d1-434a-9643-0df8acf91954	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-11-20 00:00:00+00	100.000000	8.950000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008644386 | Efectivo: 895.0	2025-12-29 16:54:31.197624+00	\N
fd20348d-6629-4e17-a309-574217113e1c	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-11-20 00:00:00+00	100.000000	8.950000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008644386 | Efectivo: 895.0	2025-12-29 16:54:31.197624+00	\N
46aff3cf-9304-4d74-91e3-9407614c97a7	ef16e018-8e81-4ac6-933d-3fd911dd372c	60d0d8a5-b85e-43a0-815a-db98f8560a8e	BUY	2025-11-20 00:00:00+00	50.000000	170.000000	23.010000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008644642 | Efectivo: 8523.01	2025-12-29 16:54:31.197624+00	\N
83272fa8-53f7-4a9a-ac1f-6e7a15e2774a	ef16e018-8e81-4ac6-933d-3fd911dd372c	d16bccd0-5951-479e-8376-5fd876d73395	BUY	2025-11-18 00:00:00+00	40.000000	400.000000	23.170000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008637308 | Efectivo: 16023.17	2025-12-29 16:54:31.197624+00	\N
a7ea7f45-6366-4829-b0e9-3007274f4a1c	ef16e018-8e81-4ac6-933d-3fd911dd372c	d16bccd0-5951-479e-8376-5fd876d73395	BUY	2025-11-18 00:00:00+00	10.000000	400.000000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008637308 | Efectivo: 4000.0	2025-12-29 16:54:31.197624+00	\N
71708f6c-4f01-4465-8779-4ca6c82fe50e	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-11-17 00:00:00+00	100.000000	12.920000	23.180000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008636875 | Efectivo: 1315.18	2025-12-29 16:54:31.197624+00	\N
3b96a741-236d-420e-8f17-24b46aa5f51a	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-11-17 00:00:00+00	100.000000	12.920000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008636875 | Efectivo: 1292.0	2025-12-29 16:54:31.197624+00	\N
47b6ef5a-a61b-46f4-b5d1-4c78cb5f66bc	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-11-17 00:00:00+00	29.000000	12.920000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008636875 | Efectivo: 374.68	2025-12-29 16:54:31.197624+00	\N
d47cbc6d-4d59-465e-b2f7-f08b772197d7	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-11-17 00:00:00+00	20.000000	12.920000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008636875 | Efectivo: 258.4	2025-12-29 16:54:31.197624+00	\N
af345749-ac92-45db-bd61-91b33e346ffb	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-11-17 00:00:00+00	48.000000	12.920000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008636875 | Efectivo: 620.16	2025-12-29 16:54:31.197624+00	\N
d62b79c1-fdd6-4b1a-b5df-061b2161d279	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-11-17 00:00:00+00	100.000000	12.920000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008636875 | Efectivo: 1292.0	2025-12-29 16:54:31.197624+00	\N
a46119d7-a860-4d44-906d-a078f15ce618	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-11-17 00:00:00+00	21.000000	12.920000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008636875 | Efectivo: 271.32	2025-12-29 16:54:31.197624+00	\N
de2b48f5-7062-4b5b-b1b6-001c5837b0eb	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-11-17 00:00:00+00	1.000000	12.920000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008636875 | Efectivo: 12.92	2025-12-29 16:54:31.197624+00	\N
dd377f51-843a-41a5-bc27-0fb71cce9a1e	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-11-17 00:00:00+00	79.000000	12.920000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008636875 | Efectivo: 1020.68	2025-12-29 16:54:31.197624+00	\N
f0e87b34-3561-4d0f-bf71-42187bdf3987	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-11-17 00:00:00+00	79.000000	12.920000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008636875 | Efectivo: 1020.68	2025-12-29 16:54:31.197624+00	\N
9c164129-f872-4150-9149-8cdebd41a863	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-11-17 00:00:00+00	23.000000	12.920000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008636875 | Efectivo: 297.16	2025-12-29 16:54:31.197624+00	\N
069f5bde-c12f-404e-af09-58f87d25cc9a	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-11-17 00:00:00+00	200.000000	8.800000	23.180000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008636844 | Efectivo: 1783.18	2025-12-29 16:54:31.197624+00	\N
21eafdde-b9aa-447e-b129-9325f4269fa4	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-11-17 00:00:00+00	200.000000	8.800000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008636844 | Efectivo: 1760.0	2025-12-29 16:54:31.197624+00	\N
981d361b-6889-4b4c-b207-c3ff85553758	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-11-17 00:00:00+00	100.000000	8.800000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008636844 | Efectivo: 880.0	2025-12-29 16:54:31.197624+00	\N
1d98c373-44ed-4a61-a990-887786b338ac	ef16e018-8e81-4ac6-933d-3fd911dd372c	60d0d8a5-b85e-43a0-815a-db98f8560a8e	BUY	2025-11-17 00:00:00+00	100.000000	170.000000	23.180000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008636858 | Efectivo: 17023.18	2025-12-29 16:54:31.197624+00	\N
16e7d1db-4826-4d08-99d7-ab4f74f9f73f	ef16e018-8e81-4ac6-933d-3fd911dd372c	f2f9a893-992a-4c0f-aafc-c517e78a1d3b	BUY	2025-11-17 00:00:00+00	100.000000	186.000000	23.180000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008636868 | Efectivo: 18623.18	2025-12-29 16:54:31.197624+00	\N
bf66ecf6-a6da-4d3c-b363-b1665d8541a3	ef16e018-8e81-4ac6-933d-3fd911dd372c	0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	SELL	2025-11-05 00:00:00+00	150.000000	170.420000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008609851 | Efectivo: 25543.0	2025-12-29 16:54:31.197624+00	\N
424c3ce6-1015-48ab-a6f0-553b6dffada9	ef16e018-8e81-4ac6-933d-3fd911dd372c	d16bccd0-5951-479e-8376-5fd876d73395	SELL	2025-11-04 00:00:00+00	100.000000	449.800000	89.960000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008607789 | Efectivo: 44890.04	2025-12-29 16:54:31.197624+00	\N
7c8865c1-597d-47d2-a6a7-752fd39e16e9	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	SELL	2025-11-04 00:00:00+00	70.000000	393.250000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008608713 | Efectivo: 27507.5	2025-12-29 16:54:31.197624+00	\N
abef2167-2861-4c2b-aa5c-39fb3c5964f1	ef16e018-8e81-4ac6-933d-3fd911dd372c	f2f9a893-992a-4c0f-aafc-c517e78a1d3b	SELL	2025-11-04 00:00:00+00	200.000000	198.560000	22.960000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008609692 | Efectivo: 39689.06	2025-12-29 16:54:31.197624+00	\N
bf913dee-1377-46df-b856-053019ef5fda	ef16e018-8e81-4ac6-933d-3fd911dd372c	eb98c06a-985b-4bba-80b8-99dd23bc10dc	CORPORATE	2025-10-03 00:00:00+00	17.000000	0.000000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa	2025-12-29 16:54:31.197624+00	\N
ec7922f2-5fea-42c7-83e6-2bcdf46d5ca4	ef16e018-8e81-4ac6-933d-3fd911dd372c	09c50649-005b-424e-a047-3798e057b20e	SELL	2025-06-25 00:00:00+00	1500.000000	0.700000	6.810000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20250624835253 | Efectivo: 1043.19	2025-12-29 16:54:31.197624+00	\N
64a7c816-4362-4d9e-9e7a-01c7529c1085	ef16e018-8e81-4ac6-933d-3fd911dd372c	09c50649-005b-424e-a047-3798e057b20e	BUY	2025-06-18 00:00:00+00	1000.000000	0.690000	6.810000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20250624798148 | Efectivo: 696.81	2025-12-29 16:54:31.197624+00	\N
cc72d3eb-f9b1-48e6-b7f5-f3604811cb66	ef16e018-8e81-4ac6-933d-3fd911dd372c	09c50649-005b-424e-a047-3798e057b20e	BUY	2025-06-16 00:00:00+00	500.000000	0.400000	6.110000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20250624784952 | Efectivo: 206.11	2025-12-29 16:54:31.197624+00	\N
b5a11e95-8b72-408e-b8b0-1f03cf0aa324	ef16e018-8e81-4ac6-933d-3fd911dd372c	85c79f2c-3f6c-47f9-b04e-e1d793e01a17	SELL	2025-02-24 00:00:00+00	400.000000	25.180000	20.920000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008032758 | Efectivo: 10051.48	2025-12-29 16:54:31.197624+00	\N
09697d56-119a-46fb-9328-ce4ccdfc72da	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-02-24 00:00:00+00	100.000000	24.500000	20.920000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008034202 | Efectivo: 2470.92	2025-12-29 16:54:31.197624+00	\N
eb1f2424-15ae-4dbf-a5b0-a4907e2c3897	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-02-24 00:00:00+00	146.000000	24.500000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008034202 | Efectivo: 3577.0	2025-12-29 16:54:31.197624+00	\N
f86465bd-2309-4270-9aba-622cda6b426c	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-02-24 00:00:00+00	54.000000	24.500000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008034202 | Efectivo: 1323.0	2025-12-29 16:54:31.197624+00	\N
c9a2a558-63ef-4b34-8680-8c722bb2b00c	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-02-21 00:00:00+00	100.000000	30.220000	20.910000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008030594 | Efectivo: 3043.28	2025-12-29 16:54:31.197624+00	\N
b84f837f-7bfc-45f7-a7d2-96f5a416a276	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	SELL	2025-02-20 00:00:00+00	15000.000000	0.440000	20.860000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008025512 | Efectivo: 6634.64	2025-12-29 16:54:31.197624+00	\N
d897e216-1d02-4947-986f-3a65b2b9fe81	ef16e018-8e81-4ac6-933d-3fd911dd372c	d16bccd0-5951-479e-8376-5fd876d73395	BUY	2025-02-20 00:00:00+00	10.000000	356.220000	20.860000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008025572 | Efectivo: 3583.09	2025-12-29 16:54:31.197624+00	\N
a850fdff-ffc7-4ec1-bc5f-10b5227f6509	ef16e018-8e81-4ac6-933d-3fd911dd372c	85c79f2c-3f6c-47f9-b04e-e1d793e01a17	BUY	2025-02-20 00:00:00+00	100.000000	25.590000	20.860000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008026301 | Efectivo: 2579.81	2025-12-29 16:54:31.197624+00	\N
8fec08f5-bfe8-4b98-add2-ebda45dfea3a	ef16e018-8e81-4ac6-933d-3fd911dd372c	d16bccd0-5951-479e-8376-5fd876d73395	BUY	2025-02-18 00:00:00+00	40.000000	357.880000	20.890000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000008018990 | Efectivo: 14336.19	2025-12-29 16:54:31.197624+00	\N
64287868-ad6e-4db8-9ba5-c696c678b72e	ef16e018-8e81-4ac6-933d-3fd911dd372c	85c79f2c-3f6c-47f9-b04e-e1d793e01a17	BUY	2025-02-04 00:00:00+00	300.000000	24.330000	20.640000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007989844 | Efectivo: 7319.34	2025-12-29 16:54:31.197624+00	\N
4931b995-f5a9-47ab-b358-9fbe419b034e	ef16e018-8e81-4ac6-933d-3fd911dd372c	0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	BUY	2025-02-03 00:00:00+00	40.000000	113.600000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007985577 | Efectivo: 4564.0	2025-12-29 16:54:31.197624+00	\N
a09b81c2-c437-4dca-ae7b-741fcdc825a4	ef16e018-8e81-4ac6-933d-3fd911dd372c	0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	BUY	2025-02-03 00:00:00+00	10.000000	113.600000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007985577 | Efectivo: 1136.0	2025-12-29 16:54:31.197624+00	\N
01ec33d4-4638-4503-b018-1d18f2a1c989	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	BUY	2025-02-03 00:00:00+00	6.000000	373.550000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007987677 | Efectivo: 2261.3	2025-12-29 16:54:31.197624+00	\N
8d0eb97b-0272-47d2-bf77-f8452f370719	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	BUY	2025-02-03 00:00:00+00	5.000000	373.550000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007987677 | Efectivo: 1867.75	2025-12-29 16:54:31.197624+00	\N
1a93c0c6-8482-4a27-b7d1-e3c80a95450b	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	BUY	2025-02-03 00:00:00+00	9.000000	373.550000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007987677 | Efectivo: 3361.95	2025-12-29 16:54:31.197624+00	\N
b17b8cc9-220d-45f1-bc7c-182b85e5e9d2	ef16e018-8e81-4ac6-933d-3fd911dd372c	f2f9a893-992a-4c0f-aafc-c517e78a1d3b	BUY	2025-02-03 00:00:00+00	50.000000	115.660000	20.530000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007988092 | Efectivo: 5803.51	2025-12-29 16:54:31.197624+00	\N
0cccbee8-bb01-4be4-9dc8-f3c5d3a3965b	ef16e018-8e81-4ac6-933d-3fd911dd372c	f2f9a893-992a-4c0f-aafc-c517e78a1d3b	BUY	2025-01-31 00:00:00+00	50.000000	119.590000	20.750000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007985053 | Efectivo: 6000.25	2025-12-29 16:54:31.197624+00	\N
ebf680de-d734-4515-8036-c8421d4c2f85	ef16e018-8e81-4ac6-933d-3fd911dd372c	0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	BUY	2025-01-30 00:00:00+00	50.000000	113.760000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007981455 | Efectivo: 5708.0	2025-12-29 16:54:31.197624+00	\N
299d7642-3362-4533-aa98-ecea5fb5b8f2	ef16e018-8e81-4ac6-933d-3fd911dd372c	f2f9a893-992a-4c0f-aafc-c517e78a1d3b	BUY	2025-01-29 00:00:00+00	50.000000	124.500000	20.830000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007978008 | Efectivo: 6245.83	2025-12-29 16:54:31.197624+00	\N
11c26b94-4568-40f5-b963-d5d9d0065fc9	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	BUY	2025-01-28 00:00:00+00	18.000000	383.900000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007973583 | Efectivo: 6930.2	2025-12-29 16:54:31.197624+00	\N
8f3e6ba9-157b-4087-97fe-daa677010246	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	BUY	2025-01-28 00:00:00+00	32.000000	383.950000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007973583 | Efectivo: 12286.4	2025-12-29 16:54:31.197624+00	\N
1e380ea7-cc22-4dd9-97fb-b5d8c514fee2	ef16e018-8e81-4ac6-933d-3fd911dd372c	d16bccd0-5951-479e-8376-5fd876d73395	BUY	2025-01-28 00:00:00+00	50.000000	398.000000	20.820000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007975994 | Efectivo: 19920.82	2025-12-29 16:54:31.197624+00	\N
0f8ca982-fe88-40e2-a39d-bad0dbb1e6eb	ef16e018-8e81-4ac6-933d-3fd911dd372c	0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	BUY	2025-01-27 00:00:00+00	10.000000	117.000000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007970107 | Efectivo: 1190.0	2025-12-29 16:54:31.197624+00	\N
15edb4f2-06f4-4a45-a81f-11a5e92748ce	ef16e018-8e81-4ac6-933d-3fd911dd372c	0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	BUY	2025-01-27 00:00:00+00	40.000000	117.000000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007970107 | Efectivo: 4680.0	2025-12-29 16:54:31.197624+00	\N
14ea0105-9851-4576-a33c-4e6edbfa7a3e	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-01-27 00:00:00+00	93.000000	13.700000	21.030000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007970065 | Efectivo: 1295.13	2025-12-29 16:54:31.197624+00	\N
ced22c3a-16e5-4d4a-a204-31769f44a854	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-01-27 00:00:00+00	7.000000	13.700000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007970065 | Efectivo: 95.9	2025-12-29 16:54:31.197624+00	\N
412898fc-843b-4da1-9995-c16e6cc639e2	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-01-27 00:00:00+00	100.000000	13.700000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007970065 | Efectivo: 1370.0	2025-12-29 16:54:31.197624+00	\N
08a84d43-f6da-4326-9083-6fd45fdf685d	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-01-27 00:00:00+00	3.000000	13.700000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007970065 | Efectivo: 41.1	2025-12-29 16:54:31.197624+00	\N
baa7e83e-90ea-4afd-9e6f-a395842f5fa2	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-01-27 00:00:00+00	21.000000	13.700000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007970065 | Efectivo: 287.7	2025-12-29 16:54:31.197624+00	\N
2b5d302b-de0e-463b-9bdf-575c364950af	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-01-27 00:00:00+00	100.000000	13.700000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007970065 | Efectivo: 1370.0	2025-12-29 16:54:31.197624+00	\N
f3fc7ed6-4052-471a-a043-fa73822f4317	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-01-27 00:00:00+00	39.000000	13.700000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007970065 | Efectivo: 534.3	2025-12-29 16:54:31.197624+00	\N
39747dc7-875a-4210-b67b-8c6fddf6e4f7	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-01-27 00:00:00+00	53.000000	13.700000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007970065 | Efectivo: 726.1	2025-12-29 16:54:31.197624+00	\N
0ec7d161-3188-44be-b430-24cc1d11800f	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-01-27 00:00:00+00	61.000000	13.700000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007970065 | Efectivo: 835.7	2025-12-29 16:54:31.197624+00	\N
ef063339-8969-4cec-9c80-62a81305fae5	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-01-27 00:00:00+00	23.000000	13.700000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007970065 | Efectivo: 315.1	2025-12-29 16:54:31.197624+00	\N
def7b1f7-e870-4691-a104-d12d9157ffc6	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-01-27 00:00:00+00	100.000000	12.580000	21.030000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007972314 | Efectivo: 1279.03	2025-12-29 16:54:31.197624+00	\N
ce39d282-0f1c-4147-9af5-c0d2b834091e	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-01-27 00:00:00+00	400.000000	12.580000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007972314 | Efectivo: 5032.0	2025-12-29 16:54:31.197624+00	\N
134f7c8e-b09b-4137-ad34-94e350a59b5f	ef16e018-8e81-4ac6-933d-3fd911dd372c	f2f9a893-992a-4c0f-aafc-c517e78a1d3b	BUY	2025-01-27 00:00:00+00	50.000000	118.680000	21.030000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007972331 | Efectivo: 5955.03	2025-12-29 16:54:31.197624+00	\N
8cc13e2c-65ba-4785-a998-523fbd83cfe0	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-01-27 00:00:00+00	100.000000	11.970000	21.030000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007972318 | Efectivo: 1218.03	2025-12-29 16:54:31.197624+00	\N
6e71b093-c0a2-48a9-a098-d610bfd5427c	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-01-27 00:00:00+00	76.000000	11.970000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007972318 | Efectivo: 909.72	2025-12-29 16:54:31.197624+00	\N
c1604afb-16e0-4571-ac47-fcfa90cd234a	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-01-27 00:00:00+00	4.000000	11.970000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007972318 | Efectivo: 47.88	2025-12-29 16:54:31.197624+00	\N
b2776584-c81e-44ac-a176-9c5a5825c03c	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-01-27 00:00:00+00	68.000000	11.970000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007972318 | Efectivo: 813.96	2025-12-29 16:54:31.197624+00	\N
ab4002b4-7c1c-4827-84c5-86874f5a8506	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-01-27 00:00:00+00	18.000000	11.970000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007972318 | Efectivo: 215.46	2025-12-29 16:54:31.197624+00	\N
f17cdbcd-e25b-49af-892f-2a9d0c94bf89	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-01-27 00:00:00+00	16.000000	11.970000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007972318 | Efectivo: 191.52	2025-12-29 16:54:31.197624+00	\N
496e09ae-130e-40df-a4c1-649626643b2d	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-01-27 00:00:00+00	100.000000	11.970000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007972318 | Efectivo: 1197.0	2025-12-29 16:54:31.197624+00	\N
a3c0aba7-34e3-4ea6-b1a7-779565ce919c	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-01-27 00:00:00+00	100.000000	11.970000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007972318 | Efectivo: 1197.0	2025-12-29 16:54:31.197624+00	\N
f3e58f77-5a22-4ed2-8641-af63fe752e5a	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-01-27 00:00:00+00	18.000000	11.970000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007972318 | Efectivo: 215.46	2025-12-29 16:54:31.197624+00	\N
b8a0f8ad-6c8a-48c4-8c0d-e5e3c178aff4	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-23 00:00:00+00	900.000000	1.060000	20.790000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007964167 | Efectivo: 974.79	2025-12-29 16:54:31.197624+00	\N
4fefe4e4-861e-431d-a6a6-1c6aa5c2620c	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-23 00:00:00+00	400.000000	1.060000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007964167 | Efectivo: 424.0	2025-12-29 16:54:31.197624+00	\N
693eba27-1691-4d17-a65f-8d287c7ad06c	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-23 00:00:00+00	200.000000	1.060000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007964167 | Efectivo: 212.0	2025-12-29 16:54:31.197624+00	\N
cd7be5b6-a0d6-436c-9001-5c3f9037d372	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-23 00:00:00+00	169.000000	1.060000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007964167 | Efectivo: 179.14	2025-12-29 16:54:31.197624+00	\N
be12d4c6-87d5-4bfd-8c4f-811c509df458	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-23 00:00:00+00	331.000000	1.060000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007964167 | Efectivo: 350.86	2025-12-29 16:54:31.197624+00	\N
1f8f6837-1f1f-43f8-817c-ba9d658414e0	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-23 00:00:00+00	500.000000	1.060000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007964167 | Efectivo: 530.0	2025-12-29 16:54:31.197624+00	\N
b0590027-85b8-4cfb-a98e-60216c6c8539	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-23 00:00:00+00	1980.000000	1.060000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007964167 | Efectivo: 2098.8	2025-12-29 16:54:31.197624+00	\N
a2b6a43d-6aec-4c00-a639-1ac9175ec088	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-23 00:00:00+00	220.000000	1.060000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007964167 | Efectivo: 233.2	2025-12-29 16:54:31.197624+00	\N
1278802f-a079-45c7-ba1b-b6564c245d36	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-23 00:00:00+00	300.000000	1.060000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007964167 | Efectivo: 318.0	2025-12-29 16:54:31.197624+00	\N
da6847bf-8657-4f44-ae75-8c8413dda656	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-01-23 00:00:00+00	8.000000	13.210000	20.790000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007964945 | Efectivo: 126.45	2025-12-29 16:54:31.197624+00	\N
975d6849-a414-4f67-847e-690fb66e75bb	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-01-23 00:00:00+00	492.000000	13.210000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007964945 | Efectivo: 6497.84	2025-12-29 16:54:31.197624+00	\N
49889b16-6a2f-4029-a452-794ab9b8ad91	ef16e018-8e81-4ac6-933d-3fd911dd372c	2fde9ac4-0013-45fc-b0b8-1cf5d596e773	BUY	2025-01-22 00:00:00+00	500.000000	14.110000	20.860000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007961694 | Efectivo: 7074.36	2025-12-29 16:54:31.197624+00	\N
f4085c06-8943-4f2e-a3e3-09bfe06808ae	ef16e018-8e81-4ac6-933d-3fd911dd372c	207d3e06-99b8-4b52-ab56-81e11324ecec	BUY	2025-01-22 00:00:00+00	500.000000	15.250000	20.860000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007961711 | Efectivo: 7645.86	2025-12-29 16:54:31.197624+00	\N
90d5e69d-35e4-4c0c-8cdd-0d9cdc12a055	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	300.000000	1.220000	20.690000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 386.69	2025-12-29 16:54:31.197624+00	\N
0103f10d-26e4-4174-a3cf-c94ca86113ec	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	300.000000	1.220000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 366.0	2025-12-29 16:54:31.197624+00	\N
5fd35e19-e79d-4d5b-b5ae-cfd8eea8f3dd	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	300.000000	1.220000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 366.0	2025-12-29 16:54:31.197624+00	\N
caa32dfe-7a01-4c3d-ba8e-7d08865e8cc1	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	500.000000	1.220000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 610.0	2025-12-29 16:54:31.197624+00	\N
5305481d-b099-4d0d-bafe-841d74e43bf0	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	100.000000	1.220000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 122.0	2025-12-29 16:54:31.197624+00	\N
d648e94c-f0a0-48a7-9e97-da43bd8470dc	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	100.000000	1.220000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 122.0	2025-12-29 16:54:31.197624+00	\N
9e51b861-172e-4d9a-a1af-9e3db67904cb	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	300.000000	1.220000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 366.0	2025-12-29 16:54:31.197624+00	\N
0c1ef909-3c2f-41d7-9f73-4ba5c2deda0e	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	200.000000	1.220000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 244.0	2025-12-29 16:54:31.197624+00	\N
2a29f3b3-cd6c-4a9d-8e8c-c38121af68b3	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	900.000000	1.220000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 1098.0	2025-12-29 16:54:31.197624+00	\N
9cc234d1-dc75-4234-9f80-7e973a5484ed	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	500.000000	1.220000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 610.0	2025-12-29 16:54:31.197624+00	\N
23999e55-f337-41f3-8f96-583f55d05fde	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	100.000000	1.220000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 122.0	2025-12-29 16:54:31.197624+00	\N
1af4583a-a418-4da6-8948-334ce5ca46b3	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	300.000000	1.220000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 366.0	2025-12-29 16:54:31.197624+00	\N
0e3e22e2-2982-4206-8f05-8cf3d3f5d50b	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	100.000000	1.220000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 122.0	2025-12-29 16:54:31.197624+00	\N
371e40aa-d7c0-4a80-be3a-d904f0fcac70	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	100.000000	1.220000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 122.0	2025-12-29 16:54:31.197624+00	\N
b4b6be92-f51a-441d-9274-9747ffce9d05	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	100.000000	1.220000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 122.0	2025-12-29 16:54:31.197624+00	\N
cf508655-0d5a-4442-a375-2da97e7b3e8e	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	200.000000	1.220000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 244.0	2025-12-29 16:54:31.197624+00	\N
99e71aa2-eae2-4f4a-8e90-01b944ca5240	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	300.000000	1.220000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 366.0	2025-12-29 16:54:31.197624+00	\N
15a61cd7-e662-4614-9e87-ee18459ac8e1	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	100.000000	1.220000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 122.0	2025-12-29 16:54:31.197624+00	\N
61ec0cf3-4802-434c-b3b2-612f2cd8ac77	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	100.000000	1.220000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 122.0	2025-12-29 16:54:31.197624+00	\N
9a491f81-396f-408f-b571-221d2bdaf0e2	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2025-01-21 00:00:00+00	100.000000	1.220000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007957001 | Efectivo: 122.0	2025-12-29 16:54:31.197624+00	\N
2210356c-c569-4eaf-82fd-e858eaba8389	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	SELL	2025-01-02 00:00:00+00	10000.000000	3.550000	8.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20250123848379 | Efectivo: 35512.0	2025-12-29 16:54:31.197624+00	\N
851a8375-276d-4aa5-a48f-2183896a8d13	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	SELL	2024-12-19 00:00:00+00	5000.000000	3.580000	8.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20241223807638 | Efectivo: 17880.5	2025-12-29 16:54:31.197624+00	\N
d3dc4530-0ac7-4070-ae78-77e2ac76b16e	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	SELL	2024-12-19 00:00:00+00	50.000000	428.800000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007906331 | Efectivo: 21420.0	2025-12-29 16:54:31.197624+00	\N
a9d04e98-0a5f-40c7-abdd-3f2f13126cc1	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	SELL	2024-12-19 00:00:00+00	50.000000	428.800000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007906332 | Efectivo: 21420.0	2025-12-29 16:54:31.197624+00	\N
784f38ed-68de-4753-bdcf-e8e9ebcfc099	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2024-12-18 00:00:00+00	1500.000000	1.540000	20.970000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007904907 | Efectivo: 2330.22	2025-12-29 16:54:31.197624+00	\N
7f00dd12-8d99-4e88-8d83-39f441913d44	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2024-12-18 00:00:00+00	2000.000000	1.320000	20.970000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007905450 | Efectivo: 2659.97	2025-12-29 16:54:31.197624+00	\N
a454414f-48cf-4656-9c5a-6968df639421	ef16e018-8e81-4ac6-933d-3fd911dd372c	0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	SELL	2024-12-17 00:00:00+00	300.000000	123.280000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007901655 | Efectivo: 36964.0	2025-12-29 16:54:31.197624+00	\N
a24aafe4-9fbb-4476-827d-9d1105d77af9	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	SELL	2024-12-13 00:00:00+00	50.000000	400.450000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007895181 | Efectivo: 20002.5	2025-12-29 16:54:31.197624+00	\N
6f91ddbd-f87c-42a9-952e-7fccb1bd3742	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2024-12-06 00:00:00+00	500.000000	1.680000	21.150000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007883090 | Efectivo: 861.15	2025-12-29 16:54:31.197624+00	\N
24c25bc5-30d8-4003-a4fc-2cfbfda45f37	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2024-10-31 00:00:00+00	400.000000	3.910000	21.740000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007817205 | Efectivo: 1585.74	2025-12-29 16:54:31.197624+00	\N
d0e6f436-81c8-4804-a85a-d651f93a5511	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2024-10-31 00:00:00+00	100.000000	3.910000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007817205 | Efectivo: 391.0	2025-12-29 16:54:31.197624+00	\N
3cdd1e2e-6c57-4912-a7d3-6c3fdc4208f7	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2024-10-23 00:00:00+00	100.000000	4.100000	21.550000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007804082 | Efectivo: 431.55	2025-12-29 16:54:31.197624+00	\N
394b6ec1-b99c-4bd2-987d-ce06b92889bd	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2024-10-23 00:00:00+00	100.000000	4.100000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007804082 | Efectivo: 410.0	2025-12-29 16:54:31.197624+00	\N
6c6a8a3a-e49c-45ce-9f8b-e559b377a930	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2024-10-23 00:00:00+00	2.000000	4.100000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007804082 | Efectivo: 8.2	2025-12-29 16:54:31.197624+00	\N
c2576df0-4b7b-4fc4-8c2e-8fd4d122c5f8	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2024-10-23 00:00:00+00	167.000000	4.100000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007804082 | Efectivo: 684.7	2025-12-29 16:54:31.197624+00	\N
3718f2cb-206d-4091-acd4-cbfcd5717022	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2024-10-23 00:00:00+00	100.000000	4.100000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007804082 | Efectivo: 410.0	2025-12-29 16:54:31.197624+00	\N
94ffbb46-66e8-4203-9cb8-b555996c10be	ef16e018-8e81-4ac6-933d-3fd911dd372c	647d1441-4c63-4ff2-b4e6-c0dbb5f48ae5	BUY	2024-10-23 00:00:00+00	31.000000	4.100000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007804082 | Efectivo: 127.1	2025-12-29 16:54:31.197624+00	\N
6abfdfea-f852-4048-a3b0-8987b072fd0d	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	SELL	2024-09-24 00:00:00+00	5000.000000	2.430000	8.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20240923462437 | Efectivo: 12142.0	2025-12-29 16:54:31.197624+00	\N
5e7ba501-fb3f-456c-9b99-e5656555b433	ef16e018-8e81-4ac6-933d-3fd911dd372c	0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	BUY	2024-09-24 00:00:00+00	9.000000	104.500000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007759227 | Efectivo: 960.5	2025-12-29 16:54:31.197624+00	\N
a9961459-c191-40d6-9d05-500e71b28b27	ef16e018-8e81-4ac6-933d-3fd911dd372c	0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	BUY	2024-09-24 00:00:00+00	51.000000	104.500000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007759227 | Efectivo: 5329.5	2025-12-29 16:54:31.197624+00	\N
91489bc8-8783-404f-9fed-6de028b054f6	ef16e018-8e81-4ac6-933d-3fd911dd372c	0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	BUY	2024-09-05 00:00:00+00	10.000000	94.000000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007733681 | Efectivo: 960.0	2025-12-29 16:54:31.197624+00	\N
0089bbe2-3197-40a6-8a2e-5f83bd7a5fc8	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	SELL	2024-09-03 00:00:00+00	1500.000000	2.180000	8.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20240923385065 | Efectivo: 3262.0	2025-12-29 16:54:31.197624+00	\N
b1b8d67a-be5f-4687-bb55-f68f69e3d712	ef16e018-8e81-4ac6-933d-3fd911dd372c	0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	BUY	2024-09-03 00:00:00+00	25.000000	100.480000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007732502 | Efectivo: 2532.0	2025-12-29 16:54:31.197624+00	\N
f46eaf52-ad27-4ca9-a69f-f8ff18ddf8f5	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	SELL	2024-08-27 00:00:00+00	1500.000000	2.150000	8.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20240823358742 | Efectivo: 3220.0	2025-12-29 16:54:31.197624+00	\N
77c40c18-bd7a-410b-8e75-e80a87a7e31c	ef16e018-8e81-4ac6-933d-3fd911dd372c	0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	BUY	2024-08-02 00:00:00+00	5.000000	95.470000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007694329 | Efectivo: 497.35	2025-12-29 16:54:31.197624+00	\N
5d50979a-125b-4b93-8276-7a3ce38648f1	ef16e018-8e81-4ac6-933d-3fd911dd372c	0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	BUY	2024-07-24 00:00:00+00	100.000000	108.460000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007680882 | Efectivo: 10866.0	2025-12-29 16:54:31.197624+00	\N
a6affb53-2561-47ad-ad55-9e301a9f8cec	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	SELL	2024-07-23 00:00:00+00	42.000000	233.000000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007678262 | Efectivo: 9766.0	2025-12-29 16:54:31.197624+00	\N
4172e451-997c-4901-a68e-50e188a8bd2f	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	SELL	2024-07-23 00:00:00+00	8.000000	233.050000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007678262 | Efectivo: 1864.4	2025-12-29 16:54:31.197624+00	\N
33099f6d-a13d-4a72-a05f-81e6d3cdb8fe	ef16e018-8e81-4ac6-933d-3fd911dd372c	0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	BUY	2024-07-18 00:00:00+00	7.000000	111.620000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007672369 | Efectivo: 801.34	2025-12-29 16:54:31.197624+00	\N
484bb6bf-ce6d-489e-9bc3-83f503d31643	ef16e018-8e81-4ac6-933d-3fd911dd372c	0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	BUY	2024-07-18 00:00:00+00	3.000000	111.640000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007672369 | Efectivo: 334.92	2025-12-29 16:54:31.197624+00	\N
941775f4-d74a-4b34-8b9e-1464f0f1daa4	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	SELL	2024-07-18 00:00:00+00	1000.000000	2.070000	8.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20240723229259 | Efectivo: 2062.0	2025-12-29 16:54:31.197624+00	\N
8c32acf3-8fc3-4092-b5cd-3f56d4737e64	ef16e018-8e81-4ac6-933d-3fd911dd372c	0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	BUY	2024-07-18 00:00:00+00	20.000000	109.300000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007672424 | Efectivo: 2206.0	2025-12-29 16:54:31.197624+00	\N
dc40d75a-6f83-41ea-995e-f7cb4a200ac9	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	SELL	2024-07-11 00:00:00+00	1000.000000	2.130000	8.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20240723203627 | Efectivo: 2117.0	2025-12-29 16:54:31.197624+00	\N
dd5b3660-6332-4808-bbec-36def7884925	ef16e018-8e81-4ac6-933d-3fd911dd372c	0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	BUY	2024-07-01 00:00:00+00	50.000000	112.260000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007651183 | Efectivo: 5633.0	2025-12-29 16:54:31.197624+00	\N
65af2d1c-26b7-4e04-a304-7b1a28ecea6f	ef16e018-8e81-4ac6-933d-3fd911dd372c	0a01b9b3-4cb2-4060-93c4-0e6e3c80c0f5	BUY	2024-06-10 00:00:00+00	20.000000	111.820000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007623277 | Efectivo: 2256.4	2025-12-29 16:54:31.197624+00	\N
9e503eb4-a7e4-45d6-b3e9-90302991f199	ef16e018-8e81-4ac6-933d-3fd911dd372c	eb98c06a-985b-4bba-80b8-99dd23bc10dc	CORPORATE	2024-06-10 00:00:00+00	1.000000	0.000000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa	2025-12-29 16:54:31.197624+00	\N
24ba3a7d-cf38-4dbd-830a-9e7fa118d70f	ef16e018-8e81-4ac6-933d-3fd911dd372c	eb98c06a-985b-4bba-80b8-99dd23bc10dc	CORPORATE	2024-06-10 00:00:00+00	16.000000	0.000000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa	2025-12-29 16:54:31.197624+00	\N
dc0ec901-375c-4591-b5ec-0d1b0b4423b9	ef16e018-8e81-4ac6-933d-3fd911dd372c	eb98c06a-985b-4bba-80b8-99dd23bc10dc	CORPORATE	2024-06-10 00:00:00+00	17.000000	0.000000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa	2025-12-29 16:54:31.197624+00	\N
5456f258-7588-4a69-ab59-24874cf6e7dc	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	SELL	2024-05-21 00:00:00+00	4000.000000	2.040000	8.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20240523016815 | Efectivo: 8160.0	2025-12-29 16:54:31.197624+00	\N
04aba43b-f2da-4008-a6aa-54489cc68a71	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	SELL	2024-04-22 00:00:00+00	1000.000000	2.030000	8.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20240422881162 | Efectivo: 2022.0	2025-12-29 16:54:31.197624+00	\N
36984862-7a21-4bcc-8fea-9b749e2b4b2a	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	BUY	2024-04-22 00:00:00+00	15.000000	132.000000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007556333 | Efectivo: 2000.0	2025-12-29 16:54:31.197624+00	\N
1b96c387-07f2-4e99-90ed-5b5ac80294b2	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	BUY	2024-04-19 00:00:00+00	5.000000	139.040000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007554406 | Efectivo: 715.2	2025-12-29 16:54:31.197624+00	\N
385dabda-e243-4e04-bb45-dd4e3a2a99ea	ef16e018-8e81-4ac6-933d-3fd911dd372c	424e567b-b2f1-4f80-a170-d20e5e3314ee	SELL	2024-04-18 00:00:00+00	100000.000000	0.010000	3.950000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20240422834114 | Efectivo: 1236.05	2025-12-29 16:54:31.197624+00	\N
96c5f8b8-c193-43a1-bcca-81bedd258080	ef16e018-8e81-4ac6-933d-3fd911dd372c	424e567b-b2f1-4f80-a170-d20e5e3314ee	SELL	2024-04-18 00:00:00+00	100000.000000	0.010000	3.950000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20240422870013 | Efectivo: 1236.05	2025-12-29 16:54:31.197624+00	\N
24fd2fd9-6521-490f-a514-a9d9ee419cfc	ef16e018-8e81-4ac6-933d-3fd911dd372c	c422c047-5282-41e2-ba3d-244aeb727f6b	SELL	2024-04-18 00:00:00+00	100000.000000	0.000000	6.180000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20240422870017 | Efectivo: 413.82	2025-12-29 16:54:31.197624+00	\N
806fbd84-2c69-4e23-b80a-f5de2beb8a00	ef16e018-8e81-4ac6-933d-3fd911dd372c	eee809be-2422-467e-8065-4b92aea15f0b	SELL	2024-04-18 00:00:00+00	200.000000	8.840000	21.340000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007552986 | Efectivo: 1746.76	2025-12-29 16:54:31.197624+00	\N
09d8f4ef-925d-473d-bfb5-b4d0f7452926	ef16e018-8e81-4ac6-933d-3fd911dd372c	dfa15de8-2d25-41b1-b674-1e4a4dd051e8	SELL	2024-04-18 00:00:00+00	28.000000	11.440000	21.340000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007552989 | Efectivo: 299.11	2025-12-29 16:54:31.197624+00	\N
c29ef0d9-0fb2-45a2-a06a-be2a5a93bd8e	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	BUY	2024-04-18 00:00:00+00	8.000000	141.400000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007553001 | Efectivo: 1151.2	2025-12-29 16:54:31.197624+00	\N
51bfc772-6e81-4eae-b32b-beaea63fcf1a	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	BUY	2024-04-18 00:00:00+00	7.000000	141.400000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007553001 | Efectivo: 989.8	2025-12-29 16:54:31.197624+00	\N
49e81e67-6596-4c67-b6fd-a6a1abc46adb	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	BUY	2024-04-18 00:00:00+00	1.000000	141.400000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007553001 | Efectivo: 141.4	2025-12-29 16:54:31.197624+00	\N
bc2d7dee-ffa9-41da-b143-52408c9eadd0	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	BUY	2024-04-18 00:00:00+00	14.000000	141.400000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007553001 | Efectivo: 1979.6	2025-12-29 16:54:31.197624+00	\N
fd36eec4-16f0-49dd-9c75-e0eec9b5bde0	ef16e018-8e81-4ac6-933d-3fd911dd372c	c422c047-5282-41e2-ba3d-244aeb727f6b	BUY	2024-04-11 00:00:00+00	50000.000000	0.000000	5.080000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20240422837630 | Efectivo: 225.08	2025-12-29 16:54:31.197624+00	\N
fcbf975e-eb57-4139-8eb7-dc3725b0d0c7	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	BUY	2024-04-08 00:00:00+00	50.000000	158.000000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007537935 | Efectivo: 7920.0	2025-12-29 16:54:31.197624+00	\N
9a5332ab-5fe0-4bf2-ae8c-bbc27755722b	ef16e018-8e81-4ac6-933d-3fd911dd372c	424e567b-b2f1-4f80-a170-d20e5e3314ee	BUY	2024-04-08 00:00:00+00	100000.000000	0.010000	3.950000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20240422821401 | Efectivo: 1263.95	2025-12-29 16:54:31.197624+00	\N
ec90a6f8-7caa-48b7-a2d7-ad02b022fccd	ef16e018-8e81-4ac6-933d-3fd911dd372c	eee809be-2422-467e-8065-4b92aea15f0b	BUY	2024-04-08 00:00:00+00	50.000000	10.200000	21.660000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007537964 | Efectivo: 531.66	2025-12-29 16:54:31.197624+00	\N
81ca1f12-30f6-474d-812d-dcdde87b5caa	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	SELL	2024-04-05 00:00:00+00	5000.000000	1.930000	8.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20240422809399 | Efectivo: 9664.0	2025-12-29 16:54:31.197624+00	\N
1d393d8b-98bf-4df9-b644-f730aaafa1dc	ef16e018-8e81-4ac6-933d-3fd911dd372c	eee809be-2422-467e-8065-4b92aea15f0b	BUY	2024-04-03 00:00:00+00	40.000000	10.520000	21.550000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007532367 | Efectivo: 442.33	2025-12-29 16:54:31.197624+00	\N
a469a457-3163-4e91-93b3-dbad1961a5ec	ef16e018-8e81-4ac6-933d-3fd911dd372c	a7df7a83-c480-40ba-964a-8668e7d66e85	CORPORATE	2024-04-01 00:00:00+00	28.000000	0.000000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa	2025-12-29 16:54:31.197624+00	\N
9dd6da90-738b-4f22-b09b-ab755f4b6f8b	ef16e018-8e81-4ac6-933d-3fd911dd372c	eee809be-2422-467e-8065-4b92aea15f0b	BUY	2024-03-28 00:00:00+00	10.000000	11.080000	21.630000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007525784 | Efectivo: 132.43	2025-12-29 16:54:31.197624+00	\N
cd0492a3-c1d8-4220-b3f5-0143aa79c2db	ef16e018-8e81-4ac6-933d-3fd911dd372c	eb98c06a-985b-4bba-80b8-99dd23bc10dc	CORPORATE	2024-03-28 00:00:00+00	16.000000	0.000000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa	2025-12-29 16:54:31.197624+00	\N
e820924e-6cae-464b-9a87-87318efebb1f	ef16e018-8e81-4ac6-933d-3fd911dd372c	eb98c06a-985b-4bba-80b8-99dd23bc10dc	CORPORATE	2024-03-28 00:00:00+00	1.000000	0.000000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa	2025-12-29 16:54:31.197624+00	\N
d1629497-cb65-40d6-8bb6-4048b23742c8	ef16e018-8e81-4ac6-933d-3fd911dd372c	a7df7a83-c480-40ba-964a-8668e7d66e85	SPLIT	2024-03-15 00:00:00+00	1000.000000	0.000000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa	2025-12-29 16:54:31.197624+00	\N
4ae7129e-1ca8-4083-9a0b-6ad4cbd75758	ef16e018-8e81-4ac6-933d-3fd911dd372c	eee809be-2422-467e-8065-4b92aea15f0b	BUY	2024-02-22 00:00:00+00	50.000000	11.500000	21.670000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007469852 | Efectivo: 596.67	2025-12-29 16:54:31.197624+00	\N
e9d012a0-52ec-491d-8ddb-450406b1a545	ef16e018-8e81-4ac6-933d-3fd911dd372c	d6a3d125-47a7-4f74-8853-7920ed6b1423	SELL	2024-02-14 00:00:00+00	20.000000	151.440000	21.400000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007457545 | Efectivo: 3007.4	2025-12-29 16:54:31.197624+00	\N
438883b7-a69f-41f2-9936-08680fd45ecb	ef16e018-8e81-4ac6-933d-3fd911dd372c	c422c047-5282-41e2-ba3d-244aeb727f6b	BUY	2023-12-20 00:00:00+00	25000.000000	0.010000	5.160000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20231222378619 | Efectivo: 130.16	2025-12-29 16:54:31.197624+00	\N
29baad9d-8c02-4a56-a0b7-1775ebff4da2	ef16e018-8e81-4ac6-933d-3fd911dd372c	a7df7a83-c480-40ba-964a-8668e7d66e85	BUY	2023-12-20 00:00:00+00	1000.000000	0.390000	21.860000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007382138 | Efectivo: 416.66	2025-12-29 16:54:31.197624+00	\N
047ca964-9788-45cb-8efb-dfbbf649531d	ef16e018-8e81-4ac6-933d-3fd911dd372c	a7df7a83-c480-40ba-964a-8668e7d66e85	SPLIT	2023-12-20 00:00:00+00	28.000000	13.890000	21.860000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Efectivo: 416.66	2025-12-29 16:54:31.197624+00	\N
e6714dcf-bcaf-45e6-b5e7-27c003c7c06c	ef16e018-8e81-4ac6-933d-3fd911dd372c	dfa15de8-2d25-41b1-b674-1e4a4dd051e8	CORPORATE	2023-12-20 00:00:00+00	28.000000	13.890000	21.860000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Efectivo: 416.66	2025-12-29 16:54:31.197624+00	\N
656affd8-a5c3-4750-97cc-7abdfb5872cb	ef16e018-8e81-4ac6-933d-3fd911dd372c	eee809be-2422-467e-8065-4b92aea15f0b	BUY	2023-10-19 00:00:00+00	20.000000	17.800000	21.130000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007306779 | Efectivo: 377.13	2025-12-29 16:54:31.197624+00	\N
9470d574-1e4b-4e33-83ad-426b87d024d1	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2023-10-18 00:00:00+00	2000.000000	1.660000	14.640000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20231022138825 | Efectivo: 3333.64	2025-12-29 16:54:31.197624+00	\N
ed79b242-2dd5-4db5-8e25-6114e421918d	ef16e018-8e81-4ac6-933d-3fd911dd372c	16906ad0-055b-4011-b0fa-1f43605a18b8	SELL	2023-06-26 00:00:00+00	40.000000	120.180000	21.820000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007181996 | Efectivo: 4785.43	2025-12-29 16:54:31.197624+00	\N
46b44105-92bb-4ba9-884f-daf870c9de44	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	BUY	2023-05-08 00:00:00+00	30.000000	156.500000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007122729 | Efectivo: 4715.0	2025-12-29 16:54:31.197624+00	\N
467ec219-58ea-4635-8b29-c45428a73b14	ef16e018-8e81-4ac6-933d-3fd911dd372c	c422c047-5282-41e2-ba3d-244aeb727f6b	BUY	2023-03-31 00:00:00+00	20000.000000	0.010000	3.950000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20230321549235 | Efectivo: 275.95	2025-12-29 16:54:31.197624+00	\N
558d1d4c-ab22-4405-b4a3-1b887ac206af	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	SELL	2023-03-01 00:00:00+00	10.000000	195.260000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007044723 | Efectivo: 1932.6	2025-12-29 16:54:31.197624+00	\N
b5aa6dc1-33d6-4270-b1e4-847dedd81354	ef16e018-8e81-4ac6-933d-3fd911dd372c	eee809be-2422-467e-8065-4b92aea15f0b	BUY	2023-02-23 00:00:00+00	20.000000	17.800000	21.220000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007038553 | Efectivo: 377.15	2025-12-29 16:54:31.197624+00	\N
079055e0-4154-470c-a1f8-e6daf353c5fa	ef16e018-8e81-4ac6-933d-3fd911dd372c	d6a3d125-47a7-4f74-8853-7920ed6b1423	BUY	2023-02-22 00:00:00+00	10.000000	58.750000	21.280000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007037296 | Efectivo: 608.78	2025-12-29 16:54:31.197624+00	\N
c7786d66-2087-4e7f-ad79-6670ea4c3362	ef16e018-8e81-4ac6-933d-3fd911dd372c	d6a3d125-47a7-4f74-8853-7920ed6b1423	BUY	2023-02-15 00:00:00+00	5.000000	68.800000	21.410000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007028949 | Efectivo: 365.41	2025-12-29 16:54:31.197624+00	\N
941601f7-b4bb-4bc7-879f-b6a89a29aa57	ef16e018-8e81-4ac6-933d-3fd911dd372c	e970be1b-915c-4613-825f-1863d362fd14	SELL	2023-02-02 00:00:00+00	250.000000	12.290000	21.950000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007007438 | Efectivo: 3050.55	2025-12-29 16:54:31.197624+00	\N
43c7de35-ea11-4278-b94a-216740a9a1f1	ef16e018-8e81-4ac6-933d-3fd911dd372c	6e713866-b5d0-4b0e-b925-5fc1e6d02002	SELL	2023-02-02 00:00:00+00	130.000000	11.330000	21.950000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007007449 | Efectivo: 1450.95	2025-12-29 16:54:31.197624+00	\N
6dbb0cb6-ef4b-4a01-97a1-3b485e2143ce	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	BUY	2023-02-02 00:00:00+00	20.000000	176.500000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007007479 | Efectivo: 3550.0	2025-12-29 16:54:31.197624+00	\N
ecf7cd65-14ef-4d7e-b80b-d7e1e7567832	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	BUY	2023-01-31 00:00:00+00	15.000000	151.000000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000007001143 | Efectivo: 2285.0	2025-12-29 16:54:31.197624+00	\N
4ca915fd-e9f5-4af8-97b7-9af39a6616b0	ef16e018-8e81-4ac6-933d-3fd911dd372c	d86b8d27-28f3-4642-b10f-1d4a06c25a1b	SELL	2023-01-26 00:00:00+00	1000.000000	2.250000	21.800000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000006996474 | Efectivo: 2228.2	2025-12-29 16:54:31.197624+00	\N
90d0b163-f055-4c9d-ba83-531aaccf9ad7	ef16e018-8e81-4ac6-933d-3fd911dd372c	85dd7271-ab8a-4157-b3a4-fa44aa509421	SELL	2023-01-25 00:00:00+00	2000.000000	3.090000	9.110000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20230121266415 | Efectivo: 6164.89	2025-12-29 16:54:31.197624+00	\N
73526b02-0111-460b-bbcf-5e9505331f94	ef16e018-8e81-4ac6-933d-3fd911dd372c	1da95179-4b3b-4945-9da3-8328e7dd3787	BUY	2023-01-25 00:00:00+00	45.000000	130.780000	20.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000006993187 | Efectivo: 5905.1	2025-12-29 16:54:31.197624+00	\N
cac72b46-849e-4063-ae1d-8b81404cbe76	ef16e018-8e81-4ac6-933d-3fd911dd372c	d86b8d27-28f3-4642-b10f-1d4a06c25a1b	BUY	2023-01-12 00:00:00+00	100.000000	4.200000	21.510000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000006975085 | Efectivo: 441.51	2025-12-29 16:54:31.197624+00	\N
212b63e3-47a0-4c1e-a642-7fecf3362cf3	ef16e018-8e81-4ac6-933d-3fd911dd372c	d86b8d27-28f3-4642-b10f-1d4a06c25a1b	BUY	2023-01-12 00:00:00+00	100.000000	4.200000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000006975085 | Efectivo: 420.0	2025-12-29 16:54:31.197624+00	\N
589e7169-ad63-4e87-a8c0-4dd2419cfeff	ef16e018-8e81-4ac6-933d-3fd911dd372c	d86b8d27-28f3-4642-b10f-1d4a06c25a1b	BUY	2023-01-12 00:00:00+00	300.000000	4.200000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000006975085 | Efectivo: 1260.0	2025-12-29 16:54:31.197624+00	\N
7dae0563-f939-4cb4-862d-c2c7d06f8fea	ef16e018-8e81-4ac6-933d-3fd911dd372c	d86b8d27-28f3-4642-b10f-1d4a06c25a1b	BUY	2023-01-12 00:00:00+00	400.000000	4.200000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000006975085 | Efectivo: 1680.0	2025-12-29 16:54:31.197624+00	\N
358b3138-6835-4744-b9b4-aecaa0a9f532	ef16e018-8e81-4ac6-933d-3fd911dd372c	d86b8d27-28f3-4642-b10f-1d4a06c25a1b	BUY	2023-01-12 00:00:00+00	100.000000	4.200000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000006975085 | Efectivo: 420.0	2025-12-29 16:54:31.197624+00	\N
361544e0-f479-43d7-b854-a785d73e00d9	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2022-10-03 00:00:00+00	3000.000000	1.040000	19.480000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20221020925090 | Efectivo: 3139.48	2025-12-29 16:54:31.197624+00	\N
1756937e-f860-4bdb-b8b2-7c8c242cce73	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2022-05-06 00:00:00+00	4500.000000	1.530000	27.370000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20220520485880 | Efectivo: 6916.87	2025-12-29 16:54:31.197624+00	\N
29542994-9234-4671-a5f0-76fb36f58912	ef16e018-8e81-4ac6-933d-3fd911dd372c	85dd7271-ab8a-4157-b3a4-fa44aa509421	BUY	2022-04-26 00:00:00+00	1000.000000	2.860000	14.830000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20220420445959 | Efectivo: 2874.83	2025-12-29 16:54:31.197624+00	\N
3e4235c8-a23f-4384-85a4-0e1504859d04	ef16e018-8e81-4ac6-933d-3fd911dd372c	85dd7271-ab8a-4157-b3a4-fa44aa509421	BUY	2022-03-22 00:00:00+00	1000.000000	3.180000	15.460000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20220320319403 | Efectivo: 3191.96	2025-12-29 16:54:31.197624+00	\N
4d1df9b0-825e-4d4e-acd1-8f022bcfd541	ef16e018-8e81-4ac6-933d-3fd911dd372c	e970be1b-915c-4613-825f-1863d362fd14	BUY	2022-03-22 00:00:00+00	120.000000	21.830000	22.020000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000006630143 | Efectivo: 2641.62	2025-12-29 16:54:31.197624+00	\N
b65a6baa-074c-40ef-81eb-c26849dbd865	ef16e018-8e81-4ac6-933d-3fd911dd372c	6e713866-b5d0-4b0e-b925-5fc1e6d02002	BUY	2022-02-07 00:00:00+00	100.000000	37.460000	22.890000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000006550937 | Efectivo: 3768.89	2025-12-29 16:54:31.197624+00	\N
e9a667de-ea59-4109-8532-0f5f1bf7326a	ef16e018-8e81-4ac6-933d-3fd911dd372c	6e713866-b5d0-4b0e-b925-5fc1e6d02002	BUY	2022-02-07 00:00:00+00	30.000000	37.460000	0.000000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000006550937 | Efectivo: 1123.8	2025-12-29 16:54:31.197624+00	\N
cc79e9cc-ae3b-4451-8f4f-6c194f1188f9	ef16e018-8e81-4ac6-933d-3fd911dd372c	16906ad0-055b-4011-b0fa-1f43605a18b8	SPLIT	2022-01-31 00:00:00+00	40.000000	133.500000	22.300000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Efectivo: 5362.3	2025-12-29 16:54:31.197624+00	\N
90ec8a4d-039b-4840-a09f-5905b713279f	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2021-12-01 00:00:00+00	500.000000	1.590000	8.290000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20211229882499 | Efectivo: 801.29	2025-12-29 16:54:31.197624+00	\N
5c405b67-5503-4e32-80ed-9192b2b510a2	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2021-11-26 00:00:00+00	2000.000000	1.600000	19.470000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20211129864408 | Efectivo: 3225.47	2025-12-29 16:54:31.197624+00	\N
e5767618-4761-4359-8d48-8c3b8b63fddb	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2021-11-26 00:00:00+00	1000.000000	1.590000	10.050000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20211129864474 | Efectivo: 1599.55	2025-12-29 16:54:31.197624+00	\N
4395fb05-fe5d-4f57-baa1-214917bef7c3	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2021-11-26 00:00:00+00	3000.000000	1.570000	22.810000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20211129866755 | Efectivo: 4717.81	2025-12-29 16:54:31.197624+00	\N
bf4ab125-0cd7-4c63-b884-4621c68fa1e6	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2021-11-24 00:00:00+00	100.000000	1.750000	5.510000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20211129852601 | Efectivo: 180.81	2025-12-29 16:54:31.197624+00	\N
309524be-1629-4512-9cc2-dcdd6167d6e9	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2021-11-22 00:00:00+00	400.000000	1.780000	8.100000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20211129846246 | Efectivo: 720.1	2025-12-29 16:54:31.197624+00	\N
4574e6c4-705a-4d10-b71d-13c44e9ed9fc	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2021-11-18 00:00:00+00	500.000000	1.820000	8.550000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20211129831826 | Efectivo: 918.55	2025-12-29 16:54:31.197624+00	\N
d3321dd7-9e17-4877-b1e1-fe439d2e1a09	ef16e018-8e81-4ac6-933d-3fd911dd372c	eee809be-2422-467e-8065-4b92aea15f0b	BUY	2021-11-16 00:00:00+00	10.000000	163.800000	22.740000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000006415039 | Efectivo: 1660.74	2025-12-29 16:54:31.197624+00	\N
770ed300-5abf-4cfa-ad15-97ea5dd3bbc2	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2021-10-20 00:00:00+00	2000.000000	1.860000	20.650000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20211029740240 | Efectivo: 3740.65	2025-12-29 16:54:31.197624+00	\N
45a6adc2-f463-47d4-85f3-57540c3dba34	ef16e018-8e81-4ac6-933d-3fd911dd372c	e970be1b-915c-4613-825f-1863d362fd14	BUY	2021-09-09 00:00:00+00	30.000000	38.640000	23.690000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000006307304 | Efectivo: 1182.74	2025-12-29 16:54:31.197624+00	\N
6076583f-3d54-4fff-b3af-7df914e28333	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2021-08-27 00:00:00+00	2000.000000	1.870000	20.690000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20210829568851 | Efectivo: 3760.69	2025-12-29 16:54:31.197624+00	\N
af251e7e-8c8b-4c2b-a1a8-c5ff6fb00630	ef16e018-8e81-4ac6-933d-3fd911dd372c	424e567b-b2f1-4f80-a170-d20e5e3314ee	BUY	2021-08-27 00:00:00+00	60000.000000	0.020000	6.910000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20210829571247 | Efectivo: 1212.91	2025-12-29 16:54:31.197624+00	\N
c55282b9-e1e5-4f3e-8959-e6c1c0ae6dd4	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2021-07-15 00:00:00+00	500.000000	1.960000	8.710000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20210729456588 | Efectivo: 989.21	2025-12-29 16:54:31.197624+00	\N
aad26c15-d2a7-4ac0-9d90-4bf4acb8648a	ef16e018-8e81-4ac6-933d-3fd911dd372c	424e567b-b2f1-4f80-a170-d20e5e3314ee	BUY	2021-07-14 00:00:00+00	40000.000000	0.030000	6.770000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20210729453301 | Efectivo: 1086.77	2025-12-29 16:54:31.197624+00	\N
e87721ff-4172-4b64-83fa-a43d9bc75aca	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2021-06-30 00:00:00+00	500.000000	1.980000	8.730000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20210629411008 | Efectivo: 999.23	2025-12-29 16:54:31.197624+00	\N
a53cfadc-fd53-4a86-ad82-baf98cb30d36	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2021-05-11 00:00:00+00	1200.000000	2.270000	16.770000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20210529244996 | Efectivo: 2741.97	2025-12-29 16:54:31.197624+00	\N
4480c7ca-3b88-4a82-bf98-60d35384c3b8	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2021-04-21 00:00:00+00	1500.000000	2.300000	20.130000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20210429162280 | Efectivo: 3467.13	2025-12-29 16:54:31.197624+00	\N
971d8c5e-18b6-4883-8d8b-40f804ab22b2	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2021-04-21 00:00:00+00	300.000000	2.210000	8.040000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20210429163157 | Efectivo: 671.34	2025-12-29 16:54:31.197624+00	\N
04d7a45a-00da-4dca-a736-57c0999fc1a4	ef16e018-8e81-4ac6-933d-3fd911dd372c	d6a3d125-47a7-4f74-8853-7920ed6b1423	BUY	2021-04-14 00:00:00+00	5.000000	381.000000	23.900000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000006077909 | Efectivo: 1928.9	2025-12-29 16:54:31.197624+00	\N
a1fd59ca-744c-400e-ad66-723f816faf20	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2021-03-23 00:00:00+00	200.000000	2.230000	7.510000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20210329061906 | Efectivo: 452.51	2025-12-29 16:54:31.197624+00	\N
d5b5c532-a848-4660-9993-eefafef25135	ef16e018-8e81-4ac6-933d-3fd911dd372c	c422c047-5282-41e2-ba3d-244aeb727f6b	SPLIT	2021-03-17 00:00:00+00	3000.000000	0.140000	6.720000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Efectivo: 426.72	2025-12-29 16:54:31.197624+00	\N
c66bf69e-f6dc-46df-9bda-5fbb5d02310a	ef16e018-8e81-4ac6-933d-3fd911dd372c	e970be1b-915c-4613-825f-1863d362fd14	BUY	2021-03-16 00:00:00+00	30.000000	45.240000	23.830000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000006025694 | Efectivo: 1380.99	2025-12-29 16:54:31.197624+00	\N
273b1233-f535-4811-a6e1-3098c5e48dd5	ef16e018-8e81-4ac6-933d-3fd911dd372c	e970be1b-915c-4613-825f-1863d362fd14	BUY	2021-03-12 00:00:00+00	20.000000	45.200000	23.850000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000006018530 | Efectivo: 927.85	2025-12-29 16:54:31.197624+00	\N
b4510267-bad8-4c45-8199-153abf81be25	ef16e018-8e81-4ac6-933d-3fd911dd372c	c422c047-5282-41e2-ba3d-244aeb727f6b	SPLIT	2021-03-11 00:00:00+00	2000.000000	0.120000	5.160000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Efectivo: 253.16	2025-12-29 16:54:31.197624+00	\N
a928f473-7941-4c9d-a0dd-be7950fac9bf	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2021-01-25 00:00:00+00	500.000000	1.600000	8.300000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20210128788145 | Efectivo: 809.3	2025-12-29 16:54:31.197624+00	\N
196a74ae-6abc-4b1d-9c38-5419878077f2	ef16e018-8e81-4ac6-933d-3fd911dd372c	e970be1b-915c-4613-825f-1863d362fd14	BUY	2021-01-19 00:00:00+00	50.000000	57.980000	24.270000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '00000005830171 | Efectivo: 2923.27	2025-12-29 16:54:31.197624+00	\N
7ca23416-3e86-4103-abf7-08bb7edf16a3	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2020-11-27 00:00:00+00	3000.000000	1.800000	13.410000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20201128531901 | Efectivo: 5413.41	2025-12-29 16:54:31.197624+00	\N
04c61fd2-a8a3-41d2-b0c4-deb289ebc2e5	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2020-09-22 00:00:00+00	1000.000000	1.030000	6.760000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20200928216327 | Efectivo: 1036.76	2025-12-29 16:54:31.197624+00	\N
40525d9f-d81b-42c3-97c4-04b4643f09e4	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2020-09-22 00:00:00+00	1000.000000	1.070000	6.770000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20200928216633 | Efectivo: 1076.77	2025-12-29 16:54:31.197624+00	\N
50225921-c575-43e1-b6a1-b7cc62c72124	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2020-09-21 00:00:00+00	1000.000000	1.050000	6.760000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20200928214996 | Efectivo: 1056.76	2025-12-29 16:54:31.197624+00	\N
f18d9fd3-8b84-42be-a25f-07b39ee4bb7d	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2020-07-22 00:00:00+00	1000.000000	2.340000	11.120000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20200727991445 | Efectivo: 2351.12	2025-12-29 16:54:31.197624+00	\N
381126a5-ee65-42de-a5cf-e582e2ba1c81	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2020-06-11 00:00:00+00	1000.000000	2.910000	11.260000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20200627797666 | Efectivo: 2921.26	2025-12-29 16:54:31.197624+00	\N
cbfe0940-c64b-46dd-b580-e22a5032d800	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2020-06-10 00:00:00+00	1000.000000	3.300000	13.160000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20200627790054 | Efectivo: 3313.16	2025-12-29 16:54:31.197624+00	\N
e50dea56-b620-42c4-b728-a7e75f909259	ef16e018-8e81-4ac6-933d-3fd911dd372c	55818ddf-5e1e-4c90-bec0-df2ca999fc7c	BUY	2020-06-10 00:00:00+00	1000.000000	3.250000	13.150000	Importado (Nuevo Formato) - Movimientos (1).xlsx | Cuenta: Bolsa | Operación: '20200627789867 | Efectivo: 3263.15	2025-12-29 16:54:31.197624+00	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: bolsav7_user
--

COPY public.users (id, username, email, hashed_password, is_active, is_admin, base_currency, created_at, updated_at) FROM stdin;
b5e93c28-df8a-45a9-8d32-077649412987	admin	admin@example.com	$2b$12$JMamZFvepx54Ae2jfVK4Cu0bKubEOm1oGVCuHkaC/b0Es2Qw4tAuu	t	t	EUR	2025-12-29 16:53:08.908137+00	\N
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: bolsav7_user
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: bolsav7_user
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: markets markets_pkey; Type: CONSTRAINT; Schema: public; Owner: bolsav7_user
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_pkey PRIMARY KEY (id);


--
-- Name: portfolios portfolios_pkey; Type: CONSTRAINT; Schema: public; Owner: bolsav7_user
--

ALTER TABLE ONLY public.portfolios
    ADD CONSTRAINT portfolios_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: bolsav7_user
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- Name: results results_pkey; Type: CONSTRAINT; Schema: public; Owner: bolsav7_user
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: bolsav7_user
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: quotes uq_quote_asset_date; Type: CONSTRAINT; Schema: public; Owner: bolsav7_user
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT uq_quote_asset_date UNIQUE (asset_id, date);


--
-- Name: results uq_result_portfolio_date; Type: CONSTRAINT; Schema: public; Owner: bolsav7_user
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT uq_result_portfolio_date UNIQUE (portfolio_id, date);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: bolsav7_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_quote_asset_date; Type: INDEX; Schema: public; Owner: bolsav7_user
--

CREATE INDEX idx_quote_asset_date ON public.quotes USING btree (asset_id, date);


--
-- Name: idx_result_portfolio_date; Type: INDEX; Schema: public; Owner: bolsav7_user
--

CREATE INDEX idx_result_portfolio_date ON public.results USING btree (portfolio_id, date);


--
-- Name: idx_transaction_portfolio_date; Type: INDEX; Schema: public; Owner: bolsav7_user
--

CREATE INDEX idx_transaction_portfolio_date ON public.transactions USING btree (portfolio_id, transaction_date);


--
-- Name: ix_assets_symbol; Type: INDEX; Schema: public; Owner: bolsav7_user
--

CREATE UNIQUE INDEX ix_assets_symbol ON public.assets USING btree (symbol);


--
-- Name: ix_markets_name; Type: INDEX; Schema: public; Owner: bolsav7_user
--

CREATE UNIQUE INDEX ix_markets_name ON public.markets USING btree (name);


--
-- Name: ix_portfolios_user_id; Type: INDEX; Schema: public; Owner: bolsav7_user
--

CREATE INDEX ix_portfolios_user_id ON public.portfolios USING btree (user_id);


--
-- Name: ix_quotes_asset_id; Type: INDEX; Schema: public; Owner: bolsav7_user
--

CREATE INDEX ix_quotes_asset_id ON public.quotes USING btree (asset_id);


--
-- Name: ix_quotes_date; Type: INDEX; Schema: public; Owner: bolsav7_user
--

CREATE INDEX ix_quotes_date ON public.quotes USING btree (date);


--
-- Name: ix_results_date; Type: INDEX; Schema: public; Owner: bolsav7_user
--

CREATE INDEX ix_results_date ON public.results USING btree (date);


--
-- Name: ix_results_portfolio_id; Type: INDEX; Schema: public; Owner: bolsav7_user
--

CREATE INDEX ix_results_portfolio_id ON public.results USING btree (portfolio_id);


--
-- Name: ix_transactions_asset_id; Type: INDEX; Schema: public; Owner: bolsav7_user
--

CREATE INDEX ix_transactions_asset_id ON public.transactions USING btree (asset_id);


--
-- Name: ix_transactions_portfolio_id; Type: INDEX; Schema: public; Owner: bolsav7_user
--

CREATE INDEX ix_transactions_portfolio_id ON public.transactions USING btree (portfolio_id);


--
-- Name: ix_transactions_transaction_date; Type: INDEX; Schema: public; Owner: bolsav7_user
--

CREATE INDEX ix_transactions_transaction_date ON public.transactions USING btree (transaction_date);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: bolsav7_user
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: bolsav7_user
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: portfolios portfolios_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bolsav7_user
--

ALTER TABLE ONLY public.portfolios
    ADD CONSTRAINT portfolios_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: quotes quotes_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bolsav7_user
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: results results_portfolio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bolsav7_user
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bolsav7_user
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE RESTRICT;


--
-- Name: transactions transactions_portfolio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bolsav7_user
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict a9kMMAuuT8I0j9iSXaEqIntliTYFfJTKNrVnvmkmuCR2mkWeYId56A333tzDdYj

