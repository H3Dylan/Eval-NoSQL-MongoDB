const express = require('express');
const router = express.Router();
const Balade = require('./model');

router.get('/all', async (req, res) => {
    try {
        const balades = await Balade.find();
        res.json(balades);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/id/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const balades = await Balade.findById(id);
        if (balades) {
            res.json(balades);
        } else {
            res.status(404).json({ message: "Balade non trouvée" });
        }
    } catch (error) {
        res.status(400).json({ message: "ID invalide" });
    }
});

router.get('/search/:search', async (req, res) => {
    const searchString = req.params.search;

    try {
        const balades = await Balade.find({
            $or: [
                { nom_poi: { $regex: searchString, $options: 'i' } },
                { texte_intro: { $regex: searchString, $options: 'i' } }
            ]
        });
        res.json(balades);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/site-internet', async (req, res) => {
    try {
        const balades = await Balade.find({ url_site: { $ne: null } });
        res.json(balades);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/mot-cle', async (req, res) => {
    try {
        const balades = await Balade.aggregate([
            {
                $match: {
                    $expr: { $gt: [{ $size: "$mot_cle" }, 5] }
                }
            }
        ]);
        res.json(balades);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/publie/:annee', async (req, res) => {
    const annee = req.params.annee;

    try {
        const regexAnnee = new RegExp(`^${annee}`, "i");
        const balades = await Balade.find({
            date_saisie: regexAnnee
        }).sort({ date_saisie: 1 }); 
        res.json(balades);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/arrondissement/:num_arrondissement', async function (req, rep) {
    const code_postal = req.params.num_arrondissement;

    const arrondissement = await Balade.countDocuments({
        code_postal: code_postal
    })
    rep.json({ count: arrondissement })
});

router.get("/synthese", async function (req, rep) {
    try {
        const synthese = await Balade.aggregate([
            {
                $group: {
                    _id: "$code_postal",
                    total: { $sum: 1 }
                }
            }
        ]);
        rep.json(synthese);
    } catch (error) {
        rep.status(500).json({ message: "Erreur serveur" });
    }
});

router.get("/categories", async function (req, rep) {
   
    const categories = await Balade.distinct("categorie");
    rep.json(categories);
});
  

router.post('/add', async (req, res) => {
    try {
      // Vérifier si les champs obligatoires sont présents
      const { nom_poi, adresse, categorie } = req.body;
      if (!nom_poi || !adresse ||!categorie) {
        return res.status(400).json({ message: 'Les champs "nom_poi", "adresse" et "categorie" sont obligatoires' });
      }

      // Créer une nouvelle instance de Balade avec les données reçues
      const nouvelleBalade = new Balade(req.body);

      // Enregistrer la nouvelle balade dans la base de données
      await nouvelleBalade.save();

      res.status(201).json(nouvelleBalade);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

router.put("/add-mot_cle/:id", async function (req, rep) {
    const baladeId = req.params.id;
    const newMotCle = req.body.mot_cle;

    const reponse = await Balade.updateOne({ _id: baladeId }, {
        $addToSet: { mot_cle: newMotCle }
    });
    rep.json(reponse);
})

router.put('/update-one/:id', async (req, res) => {
    try {
      const updatedBalade = await Balade.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!updatedBalade) {
        return res.status(404).json({ message: 'Balade not found' });
      }
      res.status(200).json(updatedBalade);
    } catch (error) {
      console.log(error)
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      res.status(500).json({ message: error.message });
    }
  });

router.put("/update-many/:search",  async (req, res) =>{
    try {
        const balade = await Balade.updateMany(
            { texte_description: { $regex: req.params.search, $options: 'i' } },
            { $set: { nom_poi: req.body.nom_poi } }
        );     
        return res.status(200).send(balade);   
    } 
    catch (error) {
        return res.status(500).send();   
    } 
});

router.delete('/delete/:id', async (req, res) => {
    try {
      const deletedBalade = await Balade.findByIdAndDelete(req.params.id);
      if (!deletedBalade) {
        return res.status(404).json({ message: 'Balade not found' });
      }
      res.status(200).json({ message: 'Balade deleted successfully' });
    } catch (error) {
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      res.status(500).json({ message: error.message });
    }
});

module.exports = router;