SELECT
    -- ゲーム基本情報
    g.id as game_id,
    g.bgg_id,
    g.primary_name,
    g.japanese_name,
    g.year_released,
    g.image_url,

    -- 評価情報
    g.avg_rating,
    g.ratings_count,
    g.comments_count,

    -- プレイ情報
    g.min_players,
    g.max_players,
    g.min_playtime,
    g.max_playtime,
    g.min_age,
    g.weight,
    g.rank_overall,

    -- ジャンルランキング情報
    STRING_AGG(DISTINCT CONCAT(gen.name, ':', ggr.rank_in_genre), ', ') as genre_rankings,

    -- ベストプレイヤー数
    STRING_AGG(DISTINCT gbpc.player_count::TEXT, ', ') as best_player_counts,

    -- 受賞情報
    STRING_AGG(DISTINCT CONCAT(a.award_name, ' (', a.award_year, ') - ', a.award_type), '; ') as awards,

    -- デザイナー
    STRING_AGG(DISTINCT d.name, ', ') as designers,

    -- アーティスト
    STRING_AGG(DISTINCT art.name, ', ') as artists,

    -- パブリッシャー
    STRING_AGG(DISTINCT p.name, ', ') as publishers,

    -- メカニクス
    STRING_AGG(DISTINCT m.name, ', ') as mechanics,

    -- カテゴリ
    STRING_AGG(DISTINCT c.name, ', ') as categories,

    -- メタデータ
    g.created_at,
    g.updated_at

FROM games g
         -- ジャンルランキング
         LEFT JOIN game_genre_ranks ggr ON g.id = ggr.game_id
         LEFT JOIN genres gen ON ggr.genre_id = gen.id

    -- ベストプレイヤー数
         LEFT JOIN game_best_player_counts gbpc ON g.id = gbpc.game_id

    -- 受賞情報
         LEFT JOIN game_awards ga ON g.id = ga.game_id
         LEFT JOIN awards a ON ga.award_id = a.id

    -- デザイナー
         LEFT JOIN game_designers gd ON g.id = gd.game_id
         LEFT JOIN designers d ON gd.designer_id = d.id

    -- アーティスト
         LEFT JOIN game_artists gart ON g.id = gart.game_id
         LEFT JOIN artists art ON gart.artist_id = art.id

    -- パブリッシャー
         LEFT JOIN game_publishers gp ON g.id = gp.game_id
         LEFT JOIN publishers p ON gp.publisher_id = p.id

    -- メカニクス
         LEFT JOIN game_mechanics gm ON g.id = gm.game_id
         LEFT JOIN mechanics m ON gm.mechanic_id = m.id

    -- カテゴリ
         LEFT JOIN game_categories gc ON g.id = gc.game_id
         LEFT JOIN categories c ON gc.category_id = c.id
where g.id in (1889,1890,1891,1892,1893,1894,1895,1896,1897,1898,1899)

GROUP BY
    g.id, g.bgg_id, g.primary_name, g.japanese_name, g.year_released,
    g.image_url, g.avg_rating, g.ratings_count, g.comments_count,
    g.min_players, g.max_players, g.min_playtime, g.max_playtime,
    g.min_age, g.weight, g.rank_overall, g.created_at, g.updated_at

ORDER BY g.id;